# IELTS Prep CBT

A computer-based IELTS practice platform: Listening, Reading, Writing and
Speaking practice plus full mock tests, with server-graded objective
questions and AI-assisted Speaking evaluation.

**Stack:** vanilla JS frontend (no build step) · Vercel serverless
functions · Firebase Admin SDK / Firestore · Brevo (transactional email)
· xAI/Grok (speech transcription + Speaking evaluation).

See `CHANGELOG.md` for what changed in this reorganization pass, and
`_archive/README.md` for an explanation of code that exists in this repo
but is **not** part of the deployed app.

## Project layout

```
index.html, app.js, style.css, auth-api.js   → the live frontend (static, no build step)
verify-email.html, reset-password.html       → standalone auth landing pages
media/                                        → put licensed/owned Listening audio & Writing chart images here
api/                                          → Vercel serverless functions (the content/auth/grading gate)
  _lib/                                        → shared server helpers (Firebase Admin, sessions, security, rate limiting, email)
  auth/                                        → register/login/logout/verify/reset endpoints
  content/                                     → published-content read endpoints
  speaking/evaluate.js                         → AI Speaking evaluator (transcribe + score)
  attempts.js                                  → objective-answer grading (Listening/Reading)
  writing.js                                   → Writing submission storage
content/question-bank.js                       → the actual seed content (tests, questions, writing tasks, speaking prompts)
scripts/                                       → seed-firestore.js, validate-production-content.js
docs/                                          → production roadmap, content policy, Firestore setup notes
firestore.rules, storage.rules                 → deny-all client access; everything goes through /api with Admin SDK
_archive/                                      → unused/dead code kept for reference, not deployed (see its README)
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
| `XAI_TRANSCRIBE_MODEL` (optional) | defaults to `xAI Speech-to-Text` |

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

## Known gaps / suggested next steps

See `docs/PRODUCTION_ROADMAP.md` for the full content plan. In addition:

- **Content volume.** The seed bank is well below the 2,000+ item target
  in `docs/PRODUCTION_ROADMAP.md` (currently ~160 Listening, ~160 Reading,
  8 Writing, 6 Speaking prompt sets). Nothing should be marked
  `published: true` without passing `npm run validate:content` and human
  content review.
- **Listening audio.** No audio files are included (`media/` is empty by
  design — see `docs/PRODUCTION_CONTENT_POLICY.md`). A Listening test
  should not be published until its audio and transcript exist.
- **React frontend.** If you want to move off the current vanilla-JS SPA,
  `_archive/unused-react-scaffold/` is an unfinished starting point, not a
  working alternative — see its notes before reviving it.
