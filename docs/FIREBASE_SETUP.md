# Firebase setup

## Services

### Firestore

Create the database in production mode. Deploy the supplied rules immediately.

### Authentication

Enable Email/Password for administrators. Visitors do not create accounts.

### App Hosting

Use App Hosting, not classic static Hosting, because this starter contains secure Next.js server route handlers.

### Admin SDK

In App Hosting, the Admin SDK uses Google Application Default Credentials automatically.

For local seed/admin scripts, use `GOOGLE_APPLICATION_CREDENTIALS` pointing to a service-account JSON stored outside the repository.

## Collections

### `events/{eventId}`

Public event configuration.

### `submissions`

All messages, including private messages. Browser access is denied.

### `publicMessages`

Sanitized messages allowed on the public wall.

### `rateLimits`

Short-lived anti-spam fingerprints. Browser access is denied.

### `admins/{uid}`

Admin authorization:

```json
{
  "role": "admin",
  "events": ["dana"]
}
```

A superadmin may use:

```json
{
  "role": "superadmin",
  "events": []
}
```
