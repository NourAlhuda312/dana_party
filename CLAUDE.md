# Claude Code project instructions

Read `AGENTS.md`, `README.md`, and `docs/SECURITY.md` before editing.

## Required checks

After code changes, run:

```bash
npm run typecheck
npm run build
```

## Architecture constraints

- Keep Next.js App Router and TypeScript strict mode.
- Keep all visitor submissions behind `/api/messages`.
- Never allow browser writes to Firestore.
- Never copy private messages into `publicMessages`.
- Preserve Arabic RTL and Palestinian wording.
- Do not add gradients or personal photos.
- Preserve the white-label `events/{slug}` model.
- Do not commit Firebase service-account keys or real secrets.
