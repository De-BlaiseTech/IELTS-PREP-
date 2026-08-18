# Firestore Practice Engine — Stage 3

This stage connects the browser practice/mock-test screens to the Firestore question bank through the Vercel backend.

## Flow

Browser → `/api/content` → Firebase Admin → Firestore

Browser → `/api/attempts` → Firebase Admin → `attempts` collection

The browser does not receive the correct answer as a scoring authority. Answers are submitted to the backend and graded against the Firestore question bank.

## Deploy

1. Keep `FIREBASE_SERVICE_ACCOUNT_JSON` configured in Vercel.
2. Deploy the project.
3. Seed the question bank once:

```bash
npm install
npm run seed:firestore
```

4. Sign in through the existing authentication flow.
5. Open Practice or Mock Tests.

## Firestore collections

- `tests`
- `questions`
- `writing_tasks`
- `speaking_prompts`
- `attempts`

## Important

Do not add Firebase service-account JSON to GitLab, SPCK, the browser, or `firebase-config.js`.

Listening audio should later be stored in Firebase Storage and referenced by an `audioUrl` field on the relevant question set/test.
