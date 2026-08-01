import { createHash, randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import {
  getAdminDb
} from "@/lib/firebase-admin";
import { validateSubmission } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
class RateLimitError extends Error {}

function getNetworkFingerprint(request: Request, eventId: string): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const salt = process.env.SUBMISSION_HASH_SALT;
const adminDb = getAdminDb();
  if (!salt || salt.length < 24) {
    throw new Error("Server configuration is missing SUBMISSION_HASH_SALT.");
  }

  return createHash("sha256")
    .update(`${salt}|${eventId}|${ip}|${userAgent}`)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const adminDb = getAdminDb();
    const input = validateSubmission(await request.json());
    const eventRef = adminDb.collection("events").doc(input.eventId);
    const fingerprint = getNetworkFingerprint(request, input.eventId);
    const rateRef = eventRef.collection("rateLimits").doc(fingerprint);
    const messageId = randomUUID();
    const submissionRef = eventRef.collection("submissions").doc(messageId);
    const publicRef = eventRef.collection("publicMessages").doc(messageId);
    const now = Date.now();

    await adminDb.runTransaction(async (transaction) => {
      const [eventSnapshot, rateSnapshot] = await Promise.all([
        transaction.get(eventRef),
        transaction.get(rateRef)
      ]);

      if (!eventSnapshot.exists) {
        throw new Error("المناسبة مش موجودة.");
      }

      const event = eventSnapshot.data() as {
        isOpen?: boolean;
        isPublished?: boolean;
      };

      if (!event.isPublished || !event.isOpen) {
        throw new Error("استقبال التهاني مسكّر حاليًا.");
      }

      if (rateSnapshot.exists) {
        const previous = rateSnapshot.data()?.lastSubmittedAt?.toMillis?.() ?? 0;
        if (now - previous < 20_000) {
          throw new RateLimitError(
            "استنى شوي قبل ما تبعث تهنئة ثانية."
          );
        }
      }

      const isPublic = input.visibility !== "private";
      const displayName =
        input.visibility === "public_named" && input.name
          ? input.name
          : "بدون اسم";

      const common = {
        message: input.message,
        visibility: input.visibility,
        displayName,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
const adminDb = getAdminDb();
      transaction.create(submissionRef, {
        ...common,
        submittedName: input.name || null,
        status: isPublic ? "published" : "private"
      });

      if (isPublic) {
        transaction.create(publicRef, {
          message: input.message,
          displayName,
          featured: false,
          createdAt: FieldValue.serverTimestamp()
        });
      }

      transaction.set(rateRef, {
        lastSubmittedAt: FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({ ok: true });
} catch (error) {
  console.error(
    "Message API failed:",
    error
  );

  const message =
    error instanceof Error
      ? error.message
      : "UNKNOWN_SERVER_ERROR";

  return Response.json(
    {
      ok: false,
      error:
        process.env.NODE_ENV ===
        "development"
          ? message
          : "صار خطأ وإحنا بنحفظ التهنئة."
    },
    {
      status: 500
    }
  );
}
}
