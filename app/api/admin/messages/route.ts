import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { assertEventAdmin } from "@/lib/admin-auth";
import {
  getAdminDb
} from "@/lib/firebase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function cleanEventId(value: string | null): string {
  const eventId = (value ?? "").trim().toLowerCase();
  const adminDb = getAdminDb();
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(eventId)) {
    throw new Error("رمز المناسبة غير صالح.");
  }
  return eventId;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const eventId = cleanEventId(url.searchParams.get("eventId"));
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
        id: item.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : null
      };
    });

    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventId?: string;
      messageId?: string;
      action?: string;
    };
const adminDb = getAdminDb();
    const eventId = cleanEventId(body.eventId ?? null);
    const messageId = String(body.messageId ?? "").trim();
    const action = String(body.action ?? "").trim();

    if (!/^[a-f0-9-]{20,60}$/i.test(messageId)) {
      throw new Error("رقم التهنئة غير صالح.");
    }

    if (
      !["publish", "hide", "feature", "unfeature", "delete"].includes(action)
    ) {
      throw new Error("العملية غير صالحة.");
    }

    await assertEventAdmin(request, eventId);

    const eventRef = adminDb.collection("events").doc(eventId);
    const submissionRef = eventRef.collection("submissions").doc(messageId);
    const publicRef = eventRef.collection("publicMessages").doc(messageId);

    await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(submissionRef);
      if (!snapshot.exists) throw new Error("التهنئة مش موجودة.");

      const data = snapshot.data() as {
        message: string;
        displayName: string;
        visibility: string;
        featured?: boolean;
      };

      if (action === "delete") {
        transaction.delete(submissionRef);
        transaction.delete(publicRef);
        return;
      }

      if (action === "hide") {
        transaction.update(submissionRef, {
          status: "hidden",
          updatedAt: FieldValue.serverTimestamp()
        });
        transaction.delete(publicRef);
        return;
      }

      if (action === "publish") {
        if (data.visibility === "private") {
          throw new Error("الرسالة الخاصة ما بننشرها.");
        }

        transaction.set(publicRef, {
          message: data.message,
          displayName: data.displayName,
          featured: Boolean(data.featured),
          createdAt: FieldValue.serverTimestamp()
        });

        transaction.update(submissionRef, {
          status: "published",
          updatedAt: FieldValue.serverTimestamp()
        });
        return;
      }

      const featured = action === "feature";
      transaction.update(submissionRef, {
        featured,
        updatedAt: FieldValue.serverTimestamp()
      });
      transaction.set(publicRef, { featured }, { merge: true });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminError(error);
  }
}

function adminError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "صار خطأ غير متوقّع.";

  const status =
    message === "UNAUTHENTICATED"
      ? 401
      : message === "FORBIDDEN"
        ? 403
        : 400;

  console.error("Admin API error:", error);

  return NextResponse.json(
    {
      ok: false,
      error:
        message === "UNAUTHENTICATED"
          ? "لازم تسجّل دخول."
          : message === "FORBIDDEN"
            ? "ما عندك صلاحية لهاي المناسبة."
            : message
    },
    { status }
  );
}
