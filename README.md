# IELTS Prep CBT

A computer-based IELTS practice platform: Listening, Reading, Writing and
Speaking practice plus full mock tests, with server-graded objective
questions and AI-assisted Speaking evaluation.

**Stack:** vanilla JS frontend (no build step) · Vercel serverless
functions · Firebase Admin SDK / Firestore · Brevo (transactional email)
· xAI/Grok (speech transcription + Speaking evaluation).

See `CHANGELOG.md` for the production changes and `GROK_MIGRATION_SETUP.md` for the AI configuration.

## Project layout

```
index.html, app.js, style.css, auth-api.js   → the live frontend (static, no build step)
verify-email.html, reset-password.html       → standalone auth landing pages
media/                                        → put licensed/owned Listening audio & Writing chart images here
api/                                          → Vercel serverless functions (the content/auth/grading gate)
  ../lib/server/                               → shared server helpers (Firebase Admin, sessions, security, rate limiting, email)
  auth.js                                      → registration/login/logout/verification/reset actions
  content.js                                   → published-content read endpoint
  speaking/evaluate.js                         → AI Speaking evaluator (STT + score)
  speaking/session.js                           → secure ephemeral-token session for live Grok examiner
  listening-audio.js                            → authenticated xAI TTS for Listening sections
  admin-seed.js                                 → one-time mobile production Firestore seeder
  attempts.js                                  → objective-answer grading (Listening/Reading)
  writing.js                                   → Writing submission + Grok evaluation
content/question-bank.js                       → the actual seed content (tests, questions, writing tasks, speaking prompts)
scripts/                                       → seed-firestore.js, validate-production-content.js
docs/                                          → production roadmap, content policy, Firestore setup notes
firestore.rules, storage.rules                 → deny-all client access; everything goes through /api with Admin SDK
```

## Local development

```bash
npm install
npm run validate:content     # sanity-check content/question-bank.js before seeding
npm run seed:firestore        # writes the seed bank into Firestore (needs FIREBASE_SERVICE_ACCOUNT_JSON)
npm start                     # vercel dev
```

## Required environment variables

Set these in the Vercel project (see `.env.example`):

| Variable | Used by |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | all `/api` routes (Firebase Admin) |
| `BREVO_API_KEY`, `BREVO_FROM_EMAIL` | verification / reset emails |
| `APP_BASE_URL` | building verification / reset links |
| `XAI_API_KEY` | Speaking transcription + evaluation |
| `XAI_EVAL_MODEL` (optional) | defaults to `grok-4.5` |
| `XAI_VOICE_MODEL` (optional) | defaults to `grok-voice-latest` for live Speaking |

Never put `FIREBASE_SERVICE_ACCOUNT_JSON` or `XAI_API_KEY` in frontend
code — they must stay server-side only.

## Security model

- Firestore and Storage deny all direct client access
  (`allow read, write: if false`); every read/write goes through a Vercel
  function using the Firebase Admin SDK.
- Passwords are hashed with scrypt (per-user salt, timing-safe compare).
  Sessions are random tokens, stored hashed in Firestore, set as `HttpOnly`,
  `SameSite=Lax` cookies.
- Objective (Listening/Reading) answers are graded server-side against the
  Firestore answer key — the browser never receives correct answers.
- `login`, `register`, `forgot-password`, and `resend-verification` are
  rate-limited per IP (`api/_lib/rate-limit.js`, Firestore-backed so it
  holds across serverless invocations).

## Production content and audio

- The bundled seed contains **2,080 original IELTS-style objective questions**: 1,040 Listening and 1,040 Reading, across 26 complete practice tests (13 Academic and 13 General Training).
- It also contains 208 Writing tasks and 312 Speaking prompt sets.
- Listening sections include original scripts and are converted to MP3 on demand through xAI TTS. This keeps the xAI key server-side and avoids shipping thousands of binary files in GitHub. The app can later be extended to pre-generate and cache approved MP3 files.
- Content is original practice material, not official IELTS test material. Human IELTS-qualified review is recommended before commercial publication.
- Use `admin-seed.html` once after deployment to seed Firestore, then remove the seeder endpoint/page from the repository.
