# Security model

## Public visitors

Visitors can read:

- Published event configuration
- Public messages

Visitors cannot directly write to Firestore. They submit through `/api/messages`.

## Submission API

The server:

- Validates event slug
- Validates visibility
- Limits name/message length
- Rejects closed/unpublished events
- Generates server timestamps
- Separates private and public data
- Applies short-term rate limiting using a one-way hash

## Admin API

The server verifies the Firebase Authentication ID token, then checks `admins/{uid}`.

## Future hardening

For wider public use:

- Add Firebase App Check token verification
- Add CAPTCHA after suspicious behavior
- Add a profanity/moderation service
- Add audit logs
- Add message retention/deletion policy
- Add automated backups/exports
