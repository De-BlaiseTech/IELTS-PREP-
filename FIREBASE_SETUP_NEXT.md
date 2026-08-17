# Firebase setup — current architecture

Project:
`ielts-prep-cbt`

Enabled in frontend:
- Firebase App
- Cloud Firestore SDK
- Firebase Storage SDK

Intentionally NOT used:
- Firebase Authentication

## Custom authentication

Authentication is handled by the backend and Resend.

Required endpoints:
- POST /api/auth/register
- POST /api/auth/resend-verification
- POST /api/auth/verify-email
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/logout

## Critical account rule

A registration must first exist as a pending verification request.

The backend MUST NOT create/activate the active `users/{uid}` profile until the email verification token has been successfully verified.

Verification tokens should be:
- one-time use
- short-lived
- cryptographically random
- invalidated when replaced
- rate limited for resend requests

The Resend API key must remain server-side.
Firebase service-account credentials must remain server-side.
