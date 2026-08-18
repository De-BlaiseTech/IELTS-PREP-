# Firestore Question Bank — Setup

The app now uses Firestore as the source of truth for the IELTS content bank.

## Collections

- `tests` — mock/practice test metadata
- `questions` — Listening and Reading questions
- `writing_tasks` — Academic and General Training Writing tasks
- `speaking_prompts` — Speaking Parts 1–3
- `attempts` — learner attempts/results
- `writing_submissions` — writing submissions
- `speaking_submissions` — speaking submissions

## Current original practice bank

The included seed contains:

- 4 mock tests: 2 Academic + 2 General Training
- 160 Listening questions
- 160 Reading questions
- 8 Writing tasks
- 6 Speaking prompt sets

The material is original IELTS-style practice content and is **not official IELTS test material**.

## Seed Firestore

From the project folder:

```bash
npm install
```

Set your Firebase Admin service account JSON as an environment variable:

```bash
export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ... }'
```

On Windows PowerShell:

```powershell
$env:FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ... }'
```

Then run:

```bash
npm run seed:firestore
```

The script uses Firestore batches and writes no Firebase credentials into source files.

## Important

Do not put the Firebase Admin service-account JSON inside the React frontend or commit it to Git/GitLab.

After seeding, the application reads published content through the Vercel `/api/content` endpoint. The local `demo.js` content remains only as a fallback when the API is unavailable.

## Production AI Speaking setup

Add these Vercel environment variables:

- `OPENAI_API_KEY` — server-side only. Never put this in frontend code or GitHub.
- `OPENAI_EVAL_MODEL` — optional; defaults to `gpt-5.6`.
- `OPENAI_TRANSCRIBE_MODEL` — optional; defaults to `gpt-4o-mini-transcribe`.

The Speaking page posts a short recording to `/api/speaking/evaluate`. The Vercel function transcribes the response and evaluates it against the four IELTS Speaking criteria, then saves the report in `speaking_evaluations`.

The current evaluator is deliberately labelled an **AI practice estimate**. It is not an official IELTS score, and pronunciation confidence is limited until an acoustic pronunciation layer is added.
