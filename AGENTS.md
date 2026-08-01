# AI agent instructions

## Product

White-label Arabic event congratulations wall. Dana is the first event.

## Non-negotiable UX

- Full Arabic Palestinian wording
- RTL
- No gradients
- No personal photos
- Navy, baby-blue, white
- Soft celebratory animations
- Music requires user interaction
- Three privacy choices
- Private messages must never enter `publicMessages`

## Engineering rules

- TypeScript strict mode
- Never expose Admin SDK credentials to the browser
- Public Firestore writes stay denied
- All submissions go through `/api/messages`
- Validate all external input server-side
- Preserve white-label event fields
- Run `npm run typecheck` and `npm run build`
- Do not remove Firestore security rules
