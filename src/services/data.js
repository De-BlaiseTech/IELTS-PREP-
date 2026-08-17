import { db } from "./firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, query, where, orderBy, limit
} from "firebase/firestore";

export const collections = {
  tests: "tests",
  questions: "questions",
  attempts: "attempts",
  users: "users",
  writing: "writing_submissions",
  speaking: "speaking_submissions"
};

export async function getPublishedTests() {
  if (!db) return null;
  const q = query(collection(db, collections.tests), where("published", "==", true), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getTest(testId) {
  if (!db) return null;
  const snap = await getDoc(doc(db, collections.tests, testId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveAttempt(attempt) {
  if (!db) return { id: `local-${Date.now()}`, ...attempt };
  const ref = await addDoc(collection(db, collections.attempts), attempt);
  return { id: ref.id, ...attempt };
}

export async function saveWritingSubmission(submission) {
  if (!db) return { id: `local-writing-${Date.now()}`, ...submission };
  const ref = await addDoc(collection(db, collections.writing), submission);
  return { id: ref.id, ...submission };
}

export async function saveSpeakingSubmission(submission) {
  if (!db) return { id: `local-speaking-${Date.now()}`, ...submission };
  const ref = await addDoc(collection(db, collections.speaking), submission);
  return { id: ref.id, ...submission };
}
