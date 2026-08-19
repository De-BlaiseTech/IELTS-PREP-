# Production 3.0 — IELTS Content, Mobile UX and Session Security

- Expanded the bundled bank to 2,080 original IELTS-style objective questions (1,040 Listening + 1,040 Reading), 208 Writing tasks and 312 Speaking prompt sets.
- Added 26 complete practice tests with four Listening sections and three Reading passages.
- Added authenticated xAI TTS endpoint for Listening audio, using server-side `XAI_API_KEY`.
- Added one-time mobile Firestore seeder at `/admin-seed.html`.
- Replaced the mobile sidebar behavior with a real navigation dropdown.
- Changed authentication UI state to session-only and invalidate the server session on page leave; returning to the site requires a fresh login.
- Reduced server session lifetime to 30 minutes.
- Kept the Grok live Speaking examiner and normal Speaking/Writing evaluation.
- Added global loading feedback to network operations.

# Changelog

## Reorganization pass

### Structure
- Moved all markdown docs (`PRODUCTION_ROADMAP.md`,
  `PRODUCTION_CONTENT_POLICY.md`, `FIRESTORE_QUESTION_BANK_SETUP.md`,
  `FIRESTORE_PRACTICE_STAGE3.md`) into `docs/`.
- Pulled the real seed content out of the unused React tree:
  `src/data/questionBank.js` → `content/question-bank.js`. Updated the
  two scripts that import it (`scripts/seed-firestore.js`,
  `scripts/validate-production-content.js`).
- Moved everything else — the unwired React scaffold (`src/`), the dead
  client-side Firestore SDK files (`firebase-config.js`,
  `firebase-service.js`), and the leftover Vite `public/` folder — into
  `_archive/`, with a README explaining why each isn't part of the
  deployed app. Nothing was deleted.
- Added `README.md`, `CHANGELOG.md`, `.env.example`, `.gitignore`.

### Fixes — closing gaps between the backend and the live frontend
- **Speaking practice now actually calls the AI evaluator.** Previously
  the record button saved a hardcoded band of 6.5 and never touched
  `/api/speaking/evaluate`. It now uploads the recording, shows the real
  per-criterion bands and feedback, and stores the result.
- **Writing responses are now saved.** Added `api/writing.js`
  (`writing_submissions` collection, word-count validation). Previously
  "submit" just showed a hardcoded band of 6.5 locally and saved nothing.
  This endpoint does not yet return an AI band score — see
  `README.md` → *Known gaps*.
- **Progress and Dashboard show real data.** The skill breakdown on both
  pages was hardcoded (e.g. Listening 7, Reading 6.5, Writing 6, Speaking
  6.5 — the same numbers regardless of actual activity). They now reflect
  the latest saved attempt per skill, and attempts are fetched from
  `/api/attempts` on login/startup instead of relying only on the local
  `localStorage` cache.
- **Rate limiting added** to `login`, `register`, `forgot-password`, and
  `resend-verification` via a new Firestore-backed limiter
  (`api/_lib/rate-limit.js`), since none of the auth endpoints had any
  protection against brute-force or spam.

### Unchanged (already solid, left as-is)
- Password hashing (scrypt), session cookies, email verification/reset
  flow.
- Firestore/Storage security rules (deny-all client access).
- Server-side objective grading in `api/attempts.js`.

## Writing AI evaluation

- **`/api/writing.js` now returns a real AI band score**, not just a save
  confirmation. It follows the same pattern as `api/speaking/evaluate.js`:
  one call to the OpenAI Responses API, scored against the four IELTS
  Writing criteria (Task Achievement/Task Response, Coherence and
  Cohesion, Lexical Resource, Grammatical Range and Accuracy), clamped to
  valid half-bands, and clearly labelled as a practice estimate — not an
  official score.
- If the AI call fails (missing key, quota, outage), the response is
  still saved with `status: "submitted"` instead of `"evaluated"` — a
  learner's writing is never lost just because scoring failed.
- The Writing page now shows the same kind of per-criterion breakdown and
  feedback as the Speaking page, and writing attempts now count toward
  the Dashboard/Progress skill averages the same way Listening, Reading,
  and Speaking already did.
- Submitting writing now costs an OpenAI call, so its rate limit was
  tightened from 30/15min to 15/15min per IP.
