import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({ credential: applicationDefault() });
}

const db = getFirestore();

const event = {
  slug: "dana",
  name: "دانة",
  score: 81,
  branch: "التجاري — ريادة وأعمال",
  introEyebrow: "يا ميت أهلًا وسهلًا فيكم",
  introTitle: "بفرحة دانة",
  introSubtitle: "اليوم بنحتفل بنجاح، وبداية حكاية جديدة",
  achievementText:
    "النجاح مش بس رقم… هو تعب وصبر وخطوة أولى بطريق أكبر.",
  formTitle: "اتركوا لدانة كلمة من القلب",
  wallTitle: "لوح كلماتكم الحلوة",
  qrText: "امسحوا الكود واتركوا لدانة كلمة تضل معها 🤍",
  musicUrl: "/audio/dana-song.mp3",
  isOpen: true,
  isPublished: true,
  theme: {
    navy: "#10233F",
    babyBlue: "#CFE8F7",
    white: "#FFFFFF",
    ink: "#162033",
    paper: "#FFFDF8"
  },
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp()
};

await db.collection("events").doc(event.slug).set(event, { merge: true });

console.log(`Seeded event: ${event.slug}`);
