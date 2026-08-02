import {
  createHash,
  randomUUID
} from "node:crypto";

import { NextResponse } from "next/server";

import {
  validateSubmission
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/messages",
    version: "messages-v3",
    runtime: "nodejs"
  });
}

function getNetworkFingerprint(
  request: Request,
  eventId: string
): string {
  const forwardedFor =
    request.headers.get("x-forwarded-for") ?? "";

  const realIp =
    request.headers.get("x-real-ip") ?? "";

  const ip =
    forwardedFor.split(",")[0]?.trim() ||
    realIp.trim() ||
    "unknown";

  const userAgent =
    request.headers.get("user-agent") ??
    "unknown";

  const salt =
    process.env.SUBMISSION_HASH_SALT?.trim();

  if (!salt || salt.length < 24) {
    throw new Error(
      "SUBMISSION_HASH_SALT is missing or too short."
    );
  }

  return createHash("sha256")
    .update(
      `${salt}|${eventId}|${ip}|${userAgent}`
    )
    .digest("hex");
}

async function readSubmission(
  request: Request
): Promise<ReturnType<typeof validateSubmission>> {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    throw new ApiError(
      400,
      "بيانات الطلب غير صالحة."
    );
  }

  try {
    return validateSubmission(requestBody);
  } catch (error) {
    throw new ApiError(
      400,
      error instanceof Error
        ? error.message
        : "بيانات التهنئة غير صالحة."
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log(
      "Messages API: request handler started."
    );

    const input =
      await readSubmission(request);

    const fingerprint =
      getNetworkFingerprint(
        request,
        input.eventId
      );

    /*
     * Load Firebase Admin inside the handler.
     * Import or initialization failures are now
     * caught by this function's try/catch.
     */
    const [
      firestoreModule,
      firebaseAdminModule
    ] = await Promise.all([
      import("firebase-admin/firestore"),
      import("@/lib/firebase-admin")
    ]);

    console.log(
      "Messages API: Firebase modules loaded."
    );

    const { FieldValue } =
      firestoreModule;

    const adminDb =
      firebaseAdminModule.getAdminDb();

    console.log(
      "Messages API: Firebase Admin initialized."
    );

    const eventRef = adminDb
      .collection("events")
      .doc(input.eventId);

    const rateRef = eventRef
      .collection("rateLimits")
      .doc(fingerprint);

    const messageId = randomUUID();

    const submissionRef = eventRef
      .collection("submissions")
      .doc(messageId);

    const publicRef = eventRef
      .collection("publicMessages")
      .doc(messageId);

    const now = Date.now();

    await adminDb.runTransaction(
      async (transaction) => {
        const [
          eventSnapshot,
          rateSnapshot
        ] = await Promise.all([
          transaction.get(eventRef),
          transaction.get(rateRef)
        ]);

        if (!eventSnapshot.exists) {
          throw new ApiError(
            404,
            "المناسبة مش موجودة."
          );
        }

        const eventData =
          eventSnapshot.data() as {
            isOpen?: boolean;
            isPublished?: boolean;
          };

        if (
          !eventData.isPublished ||
          !eventData.isOpen
        ) {
          throw new ApiError(
            409,
            "استقبال التهاني مسكّر حاليًا."
          );
        }

        if (rateSnapshot.exists) {
          const previousSubmission =
            rateSnapshot
              .data()
              ?.lastSubmittedAt
              ?.toMillis?.() ?? 0;

          if (
            now - previousSubmission <
            20_000
          ) {
            throw new ApiError(
              429,
              "استنى شوي قبل ما تبعث تهنئة ثانية."
            );
          }
        }

        const isPublic =
          input.visibility !== "private";

        const displayName =
          input.visibility ===
            "public_named" &&
          input.name
            ? input.name
            : "بدون اسم";

        const timestamp =
          FieldValue.serverTimestamp();

        transaction.create(
          submissionRef,
          {
            message: input.message,
            visibility: input.visibility,
            displayName,
            submittedName:
              input.name || null,
            status: isPublic
              ? "published"
              : "private",
            createdAt: timestamp,
            updatedAt: timestamp
          }
        );

        if (isPublic) {
          transaction.create(
            publicRef,
            {
              message: input.message,
              displayName,
              featured: false,
              createdAt:
                FieldValue.serverTimestamp()
            }
          );
        }

        transaction.set(
          rateRef,
          {
            lastSubmittedAt:
              FieldValue.serverTimestamp()
          }
        );
      }
    );

    console.log(
      "Messages API: message saved."
    );

    return NextResponse.json(
      {
        ok: true
      },
      {
        status: 201
      }
    );
  } catch (error) {
    const errorDetails =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        : {
            value: String(error)
          };

    console.error(
      "Messages API failure:",
      errorDetails
    );

    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message
        },
        {
          status: error.status
        }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          "صار خطأ بالسيرفر وإحنا بنحفظ التهنئة."
      },
      {
        status: 500
      }
    );
  }
}