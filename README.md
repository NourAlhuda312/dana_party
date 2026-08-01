# Dana Congratulations — White-label Starter

A production-oriented Arabic/Palestinian congratulations wall for events. The first seeded event is Dana's Tawjihi success celebration.

## What is included

- Next.js App Router + TypeScript
- Firebase App Hosting-compatible server runtime
- Cloud Firestore
- Firebase Authentication for the admin page
- Server-side message validation using Firebase Admin SDK
- Three visibility modes:
  - Public with name
  - Public without name
  - Private for Dana only
- Realtime public message wall
- Admin moderation page
- Music play/pause button
- No personal photos
- Navy, baby-blue and white theme
- No gradients
- White-label event data model
- Firestore security rules
- Seed and admin setup scripts
- `CLAUDE.md` and `AGENTS.md` instructions for AI-assisted development

## Recommended professional workflow

1. Keep the source in a private GitHub repository.
2. Use `main` for production and a separate branch/project for staging.
3. Let Firebase App Hosting deploy from GitHub.
4. Use Firebase Console only for infrastructure/configuration, not for editing code.
5. Use Claude Code, ChatGPT, Cursor, or another coding agent against the Git repository.
6. Require `npm run typecheck` and `npm run build` before merging.
7. Export Firestore data periodically after the event.

## Local setup

### 1. Install

```bash
npm install
```

### 2. Firebase project

Create a Firebase project, then enable:

- Firestore Database
- Authentication → Email/Password
- App Hosting

Register a Web App in Project Settings.

### 3. Environment variables

```bash
cp .env.example .env.local
```

Replace every `REPLACE_ME` value in `.env.local`.

Generate a submission salt:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put it in:

```env
SUBMISSION_HASH_SALT=the-generated-value
```

### 4. Admin credentials for local scripts

Download a service-account JSON only for local administration.

Do **not** place it inside the repository.

macOS/Linux:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/service-account.json"
```

Windows PowerShell:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\absolute\path\service-account.json"
```

### 5. Deploy Firestore rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore
```

### 6. Seed Dana's event

```bash
npm run seed:event
```

### 7. Create the admin account

In Firebase Console:

1. Authentication
2. Users
3. Add user
4. Enter Dana/family admin email and password

Then run:

```bash
npm run set:admin -- admin@example.com dana
```

### 8. Start locally

```bash
npm run dev
```

Open:

- Public event: `http://localhost:3000/dana`
- Admin: `http://localhost:3000/admin`

## Firebase App Hosting deployment

1. Push this project to GitHub.
2. Firebase Console → Hosting & Serverless → App Hosting.
3. Create backend.
4. Connect the GitHub repository.
5. Set live branch to `main`.
6. Create the runtime secret:

```bash
firebase apphosting:secrets:set submissionHashSalt
```

7. Deploy Firestore rules:

```bash
firebase deploy --only firestore
```

8. Push a commit to `main`; App Hosting deploys it.

App Hosting supplies Firebase Web SDK and Admin SDK configuration automatically. Local development still uses `.env.local` and Application Default Credentials.

## Music

Place a legally permitted audio file here:

```text
public/audio/dana-song.mp3
```

Then keep the event field:

```json
"musicUrl": "/audio/dana-song.mp3"
```

Browsers normally require a user click before playing audio, so the site intentionally uses a play/pause button.

## White-label usage

Create another event document under:

```text
events/{new-slug}
```

For example:

```text
events/sara-graduation
```

Then share:

```text
https://your-domain.com/sara-graduation
```

No source-code change is required when the event document contains all required fields.

## Data model

```text
events/{eventId}
events/{eventId}/submissions/{messageId}
events/{eventId}/publicMessages/{messageId}
events/{eventId}/rateLimits/{fingerprint}
admins/{uid}
```

Private messages exist only in `submissions`. Visitors can read only `publicMessages`.

## Important production notes

- Firebase App Hosting requires the Blaze plan.
- The submission endpoint uses a hashed network fingerprint for short-term rate limiting; it does not store a raw IP.
- For a high-traffic public campaign, add Firebase App Check and stronger abuse detection.
- Review the privacy notice before collecting messages.
- Do not put Firebase service-account JSON in the browser, GitHub, or `.env` files committed to source control.
- Use separate Firebase projects for staging and production.

See the `docs` folder and `REPLACE-ME.md`.
