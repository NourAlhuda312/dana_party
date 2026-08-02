import {
  FieldValue,
  Timestamp
} from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { assertEventAdmin } from "@/lib/admin-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_ACTIONS = [
  "publish",
  "hide",
  "feature",
  "unfeature",
  "delete"
] as const;

type AdminAction = (typeof ADMIN_ACTIONS)[number];

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function cleanEventId(value: unknown): string {
  const eventId = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(eventId)) {
    throw new ApiError(
      400,
      "رمز المناسبة غير صالح."
    );
  }

  return eventId;
}

function cleanMessageId(value: unknown): string {
  const messageId = String(value ?? "").trim();

  if (
    !/^[A-Za-z0-9_-]{10,128}$/.test(messageId)
  ) {
    throw new ApiError(
      400,
      "رقم التهنئة غير صالح."
    );
  }

  return messageId;
}

function cleanAction(value: unknown): AdminAction {
  const action = String(value ?? "").trim();

  if (
    !ADMIN_ACTIONS.includes(action as AdminAction)
  ) {
    throw new ApiError(
      400,
      "العملية غير صالحة."
    );
  }

  return action as AdminAction;
}

function serializeTimestamp(
  value: unknown
): string | null {
  return value instanceof Timestamp
    ? value.toDate().toISOString()
    : null;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const eventId = cleanEventId(
      url.searchParams.get("eventId")
    );

    await assertEventAdmin(request, eventId);

    const adminDb = getAdminDb();

    const snapshot = await adminDb
      .collection("events")
      .doc(eventId)
      .collection("submissions")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const messages = snapshot.docs.map((item) => {
      const data = item.data();

      return {
        ...data,
        id: item.id,
        createdAt: serializeTimestamp(
          data.createdAt
        ),
        updatedAt: serializeTimestamp(
          data.updatedAt
        )
      };
    });

    return NextResponse.json({
      ok: true,
      messages
    });
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventId?: unknown;
      messageId?: unknown;
      action?: unknown;
    };

    const eventId = cleanEventId(body.eventId);
    const messageId = cleanMessageId(
      body.messageId
    );
    const action = cleanAction(body.action);

    await assertEventAdmin(request, eventId);

    const adminDb = getAdminDb();

    const eventRef = adminDb
      .collection("events")
      .doc(eventId);

    const submissionRef = eventRef
      .collection("submissions")
      .doc(messageId);

    const publicRef = eventRef
      .collection("publicMessages")
      .doc(messageId);

    await adminDb.runTransaction(
      async (transaction) => {
        /*
         * All transaction reads must happen before
         * transaction writes.
         */
        const submissionSnapshot =
          await transaction.get(submissionRef);

        const publicSnapshot =
          await transaction.get(publicRef);

        if (!submissionSnapshot.exists) {
          throw new ApiError(
            404,
            "التهنئة مش موجودة."
          );
        }

        const data = submissionSnapshot.data() as {
          message?: unknown;
          displayName?: unknown;
          visibility?: unknown;
          status?: unknown;
          featured?: unknown;
          createdAt?: unknown;
        };

        const message =
          typeof data.message === "string"
            ? data.message
            : "";

        const displayName =
          typeof data.displayName === "string" &&
          data.displayName.trim()
            ? data.displayName
            : "بدون اسم";

        const visibility = String(
          data.visibility ?? ""
        );

        if (action === "delete") {
          transaction.delete(submissionRef);
          transaction.delete(publicRef);
          return;
        }

        if (action === "hide") {
          transaction.update(submissionRef, {
            status: "hidden",
            featured: false,
            updatedAt:
              FieldValue.serverTimestamp()
          });

          transaction.delete(publicRef);
          return;
        }

        if (action === "publish") {
          if (visibility === "private") {
            throw new ApiError(
              409,
              "الرسالة الخاصة ما بننشرها."
            );
          }

          if (!message.trim()) {
            throw new ApiError(
              409,
              "نص التهنئة غير موجود."
            );
          }

          const existingPublicData =
            publicSnapshot.exists
              ? publicSnapshot.data()
              : undefined;

          const createdAt =
            data.createdAt instanceof Timestamp
              ? data.createdAt
              : existingPublicData?.createdAt instanceof
                    Timestamp
                ? existingPublicData.createdAt
                : FieldValue.serverTimestamp();

          transaction.set(publicRef, {
            message,
            displayName,
            featured: Boolean(data.featured),
            createdAt
          });

          transaction.update(submissionRef, {
            status: "published",
            updatedAt:
              FieldValue.serverTimestamp()
          });

          return;
        }

        /*
         * A message must already be published before
         * it can be featured or unfeatured.
         */
        if (
          visibility === "private" ||
          !publicSnapshot.exists
        ) {
          throw new ApiError(
            409,
            "انشر التهنئة أولًا قبل تمييزها."
          );
        }

        const featured = action === "feature";

        transaction.update(submissionRef, {
          featured,
          updatedAt:
            FieldValue.serverTimestamp()
        });

        transaction.update(publicRef, {
          featured
        });
      }
    );

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    return adminError(error);
  }
}

function adminError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "UNKNOWN_ERROR";

  if (message === "UNAUTHENTICATED") {
    return NextResponse.json(
      {
        ok: false,
        error: "لازم تسجّل دخول."
      },
      { status: 401 }
    );
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "ما عندك صلاحية لهاي المناسبة."
      },
      { status: 403 }
    );
  }

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

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        ok: false,
        error: "بيانات الطلب غير صالحة."
      },
      {
        status: 400
      }
    );
  }

  console.error(
    "Unexpected admin messages API error:",
    error
  );

  return NextResponse.json(
    {
      ok: false,
      error:
        "صار خطأ بالسيرفر. جرّبوا مرة ثانية."
    },
    {
      status: 500
    }
  );
}