# Exact replacement checklist

## Required before local run

Create `.env.local` from `.env.example` and replace:

| Placeholder | Where to find it |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your apps → Web app |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same Web app config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Same Web app config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Same Web app config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same Web app config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Same Web app config |
| `SUBMISSION_HASH_SALT` | Generate locally with the command in README |

## Dana event content

Edit `scripts/seed-event.mjs` before the first seed if needed:

- `name`
- `score`
- `branch`
- `introEyebrow`
- `introTitle`
- `introSubtitle`
- `achievementText`
- `qrText`
- `musicUrl`
- Theme colors

The current defaults are:

- Name: دانة
- Score: 81%
- Branch: التجاري — ريادة وأعمال
- Navy: `#10233F`
- Baby blue: `#CFE8F7`
- White: `#FFFFFF`

## Audio file

Replace:

```text
public/audio/dana-song.mp3
```

with a licensed or owned audio file.

## Admin email

Replace this example command:

```bash
npm run set:admin -- admin@example.com dana
```

with the real Firebase Authentication email.

## Domain and QR

After deployment:

1. Add your custom domain in Firebase App Hosting.
2. Use the final URL ending in `/dana`.
3. Generate one QR code for that URL.
4. Suggested printed text:

```text
امسحوا الكود واتركوا لدانة كلمة تضل معها 🤍
```
