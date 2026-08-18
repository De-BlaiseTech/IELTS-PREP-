import { adminDb } from './firebase-admin.js';
import { getCookie, hashSecret } from './security.js';

export async function getSessionUser(req) {
  const token = getCookie(req, 'ielts_session');
  if (!token) return null;
  const ref = adminDb.collection('sessions').doc(hashSecret(token));
  const snap = await ref.get();
  if (!snap.exists) return null;
  const session = snap.data();
  const expires = session.expiresAt?.toDate ? session.expiresAt.toDate() : new Date(session.expiresAt);
  if (!expires || expires.getTime() <= Date.now()) {
    await ref.delete().catch(() => {});
    return null;
  }
  return { uid: session.uid, sessionId: ref.id };
}

export async function requireSession(req, res) {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ message: 'Please sign in to continue.' });
    return null;
  }
  return user;
}
