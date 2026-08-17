# IELTS Prep CBT — Firestore schema

## Important architecture decision

Because this project intentionally does NOT use Firebase Authentication, the browser must not directly read/write protected Firestore documents.

Vercel serverless API routes use the Firebase Admin SDK. Firestore Security Rules deny direct browser access.

This keeps the custom Resend authentication model compatible with Firestore security.

## Collections

### users/{uid}
Active verified students only.

Fields:
- name: string
- email: string
- passwordHash: string
- emailVerified: boolean
- role: "student"
- targetBand: number (optional)
- testType: "Academic" | "General Training" (optional)
- createdAt: timestamp
- updatedAt: timestamp

### pendingRegistrations/{id}
Temporary registrations awaiting email verification.

Fields:
- name
- email
- passwordHash
- verificationTokenHash
- verificationExpiresAt
- verificationSentAt
- createdAt

Never expose this collection to clients.

### sessions/{sessionHash}
Server-side sessions.

Fields:
- uid
- createdAt
- expiresAt

Never expose this collection to clients.

### questions/{questionId}
Question bank.

Fields depend on skill:
- skill: listening | reading | writing | speaking
- section
- type
- question
- options (optional)
- passage (optional)
- mediaPath (optional)
- difficulty
- tags
- explanation (optional)
- active
- createdAt
- updatedAt

Correct answers should be kept in a protected server-side field/collection rather than exposed to the browser before submission.

### questionAnswers/{questionId}
Protected answer key.

Fields:
- answer
- acceptedAnswers (optional)
- explanation
- scoringData (optional)

Only server-side scoring code reads this collection.

### tests/{testId}
Fields:
- title
- testType
- durationSeconds
- skills
- active
- createdAt
- updatedAt

### testSections/{sectionId}
Fields:
- testId
- skill
- sectionNumber
- title
- instructions
- questionIds
- mediaPath (optional)
- durationSeconds

### attempts/{attemptId}
Fields:
- uid
- testId
- skill
- startedAt
- submittedAt
- status
- answers
- score
- band
- createdAt
- updatedAt

### progress/{uid}
Aggregated student progress.

Fields:
- listening
- reading
- writing
- speaking
- overall
- testsCompleted
- updatedAt

### writingSubmissions/{submissionId}
Fields:
- uid
- attemptId
- task
- response
- wordCount
- submittedAt
- score (optional)
- feedback (optional)

### speakingAttempts/{attemptId}
Fields:
- uid
- testId
- recordingPath
- durationSeconds
- submittedAt
- score (optional)
- feedback (optional)

## Media

Firebase Storage is currently not enabled because Firebase is requiring the project to move to a paid billing plan. The application should therefore keep media behind a storage abstraction so we can use another provider without changing the database model.
