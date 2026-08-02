import {
  createHash,
  randomUUID
} from "node:crypto";

import {
  FieldValue
} from "firebase-admin/firestore";

import {
  NextResponse
} from "next/server";

import {
  getAdminDb
} from "@/lib/firebase-admin";

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
      "Server configuration is missing SUBMISSION_HASH_SALT."
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
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiError(
      400,
      "بيانات الطلب غير صالحة."
    );
  }

  try {
    return validateSubmission(body);
  } catch (error) {
    throw new ApiError(
      400,
      error instanceof Error
        ? error.message
        : "بيانات التهنئة غير صالحة."
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/messages",
    runtime: "nodejs",
    version: "messages-v2"
  });
}

export async function POST(request: Request) {
  try {
    const input = await readSubmission(request);

    const fingerprint =
      getNetworkFingerprint(
        request,
        input.eventId
      );

    const adminDb = getAdminDb();

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

        const event =
          eventSnapshot.data() as {
            isOpen?: boolean;
            isPublished?: boolean;
          };

        if (
          !event.isPublished ||
          !event.isOpen
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

        const commonData = {
          message: input.message,
          visibility: input.visibility,
          displayName,
          createdAt:
            FieldValue.serverTimestamp(),
          updatedAt:
            FieldValue.serverTimestamp()
        };

        transaction.create(
          submissionRef,
          {
            ...commonData,
            submittedName:
              input.name || null,
            status: isPublic
              ? "published"
              : "private"
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

    return NextResponse.json(
      {
        ok: true
      },
      {
        status: 201
      }
    );
  } catch (error) {
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

    console.error(
      "Unexpected messages API error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "صار خطأ وإحنا بنحفظ التهنئة."
      },
      {
        status: 500
      }
    );
  }
}