# IELTS Prep CBT — Grok Production Migration

This build replaces OpenAI with xAI/Grok and adds a real-time AI IELTS-style Speaking Examiner.

## Vercel environment variables

Keep your existing Firebase and Brevo variables:

- FIREBASE_SERVICE_ACCOUNT_JSON
- BREVO_API_KEY
- BREVO_FROM_EMAIL
- APP_BASE_URL
- SEED_SECRET (if you use the seed endpoint)

Add:

- XAI_API_KEY = your xAI API key
- XAI_EVAL_MODEL = grok-4.5
- XAI_VOICE_MODEL = grok-voice-latest

Remove these old OpenAI variables after the Grok deployment has been verified:

- OPENAI_API_KEY
- OPENAI_EVAL_MODEL
- OPENAI_TRANSCRIBE_MODEL

## What changed

### Speaking batch evaluation
`api/speaking/evaluate.js`
- xAI Speech-to-Text: `POST https://api.x.ai/v1/stt`
- Grok evaluation: `POST https://api.x.ai/v1/responses`
- Stores transcript, duration, word timing data and evaluation in Firestore.

### Real-time AI examiner
`api/speaking/session.js`
- Authenticated server endpoint creates a short-lived xAI realtime client secret.
- The browser uses the ephemeral token; the permanent XAI_API_KEY never reaches the browser.

The browser connects to:
`wss://api.x.ai/v1/realtime?model=grok-voice-latest`

The live examiner:
- speaks to the student
- asks one question at a time
- handles Part 1, Part 2 and Part 3 instructions
- streams microphone PCM audio
- receives Grok voice responses
- displays live transcription
- evaluates the completed transcript when the session ends.

## Security

Do NOT put XAI_API_KEY in:
- SPCK source
- GitHub
- frontend JavaScript
- Firebase client configuration

Only Vercel should contain the permanent xAI API key.

The browser receives only a short-lived realtime client secret from `/api/speaking/session`.

## Vercel Hobby function limit

This build consolidates authentication and content routes so the deployment uses six API functions:

- `/api/auth.js`
- `/api/content.js`
- `/api/attempts.js`
- `/api/writing.js`
- `/api/speaking/evaluate.js`
- `/api/speaking/session.js`

The shared server helpers are in `lib/server/`, not inside `api/`.

There is intentionally no `api/_lib/` directory.

## GitHub / SPCK deployment

1. Extract this ZIP.
2. Replace your current repository files with this version.
3. Do not copy the old `api/_lib` or old `api/auth` / `api/content` folders back.
4. Commit and push to GitHub.
5. In Vercel, add the three XAI variables.
6. Redeploy.
7. Test login and email verification first.
8. Test Writing evaluation.
9. Test Speaking normal recording.
10. Test Live AI Examiner.

## Important

The live examiner is an IELTS-style practice simulation, not an official IELTS examiner or score.

Pronunciation scoring is still an AI practice estimate. The realtime transcript and timing information improve the evaluation, but the system should not claim laboratory-grade phoneme/acoustic scoring.

