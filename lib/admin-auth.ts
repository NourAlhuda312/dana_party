import {
  getAdminAuth,
  getAdminDb
} from "@/lib/firebase-admin";
export async function assertEventAdmin(
  request: Request,
  eventId: string
): Promise<string> {
  const adminAuth = getAdminAuth();
const adminDb = getAdminDb();
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) {
    throw new Error("UNAUTHENTICATED");
  }

  const decoded = await adminAuth.verifyIdToken(token);
  const adminSnapshot = await adminDb.collection("admins").doc(decoded.uid).get();

  if (!adminSnapshot.exists) {
    throw new Error("FORBIDDEN");
  }

  const data = adminSnapshot.data() as {
    role?: string;
    events?: string[];
  };

  const allowed =
    data.role === "superadmin" ||
    (Array.isArray(data.events) && data.events.includes(eventId));

  if (!allowed) {
    throw new Error("FORBIDDEN");
  }

  return decoded.uid;
}
