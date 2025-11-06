## Summary
- Describe the purpose of this change in 1–3 sentences.

## What’s changed
- Bullet the notable changes (code, UI, behavior)
- Mention any new routes/APIs, env vars, or feature flags

## Screenshots / Loom (optional)
- Before / After, mobile & desktop

## How to test
1. Steps to reproduce/setup
2. Edge cases to try
3. Accessibility considerations (keyboard, screen reader)

## Consent & GDPR checklist (if applicable)
- [ ] Cookie banner appears on first page of a new session and blocks interaction until confirmed
- [ ] Consent is stored per session (`sessionStorage: cookie-consent`)
- [ ] “Manage Cookies” opens the modal with current preferences pre-filled
- [ ] Recommendations fetch only when `analytics` or `marketing` consent is granted
- [ ] `preferredCategory` is used only when `preferences` consent is granted
- [ ] No personal identifiers are sent with recommendations
- [ ] README updated (API and GDPR sections) and local testing steps included

## Risks / Rollout
- Risk level: Low / Medium / High
- Rollout plan: Any flags or staged rollout notes
- Rollback plan: Steps to revert safely

## Related
- Closes #<issue>
- Related to #<issue>
