# Deployment checklist

## Before production

- [ ] `npm install`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] Firestore rules deployed
- [ ] Dana event seeded
- [ ] Admin user created
- [ ] Admin document created
- [ ] Licensed audio uploaded
- [ ] `submissionHashSalt` secret created
- [ ] Custom domain connected
- [ ] Mobile test on Android and iPhone
- [ ] Arabic/RTL layout checked
- [ ] Private-message visibility tested
- [ ] Rate-limit response tested
- [ ] QR code tested from printed paper
- [ ] Firestore budget alerts configured
- [ ] Data export plan documented

## Recommended environments

Use two Firebase projects:

- `congratulations-staging`
- `congratulations-production`

Never test Firestore rules directly in production.
