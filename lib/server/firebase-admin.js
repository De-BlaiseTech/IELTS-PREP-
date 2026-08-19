import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");
  const serviceAccount = JSON.parse(raw);
  return cert(serviceAccount);
}

const app = getApps().length ? getApps()[0] : initializeApp({ credential: getCredential(), ...(process.env.FIREBASE_STORAGE_BUCKET ? { storageBucket: process.env.FIREBASE_STORAGE_BUCKET } : {}) });
export const adminDb = getFirestore(app);
