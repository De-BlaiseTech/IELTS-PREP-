// Central Firebase service layer.
// Never put service-account credentials in this file.
// Authentication is handled by the custom backend.

import { db, storage } from "./firebase-config.js";
import {
  doc, getDoc, setDoc, updateDoc, collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createUserProfile(uid, data) {
  // Must only be called by the trusted backend after verification.
  return setDoc(doc(db, "users", uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateUserProfile(uid, data) {
  return updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function createAttempt(data) {
  return addDoc(collection(db, "attempts"), {
    ...data,
    createdAt: serverTimestamp()
  });
}

export async function uploadUserFile(path, file) {
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}
