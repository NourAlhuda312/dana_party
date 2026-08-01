import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const [, , email, eventSlug = "dana"] = process.argv;

if (!email) {
  console.error("Usage: npm run set:admin -- admin@example.com dana");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: applicationDefault() });
}

const user = await getAuth().getUserByEmail(email);
await getFirestore().collection("admins").doc(user.uid).set(
  {
    email,
    role: "admin",
    events: [eventSlug],
    updatedAt: FieldValue.serverTimestamp()
  },
  { merge: true }
);

console.log(`Admin access granted to ${email} for ${eventSlug}`);
