import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged
} from "firebase/auth";

export const demoAuth = {
  async signIn(email) {
    const user = { uid: "demo-user", email, displayName: email.split("@")[0] };
    localStorage.setItem("ielts-demo-user", JSON.stringify(user));
    return user;
  },
  async signUp(email) {
    return this.signIn(email);
  },
  async signOut() {
    localStorage.removeItem("ielts-demo-user");
  },
  current() {
    const value = localStorage.getItem("ielts-demo-user");
    return value ? JSON.parse(value) : null;
  }
};

export async function signIn(email, password) {
  if (!auth) return demoAuth.signIn(email);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signUp(email, password) {
  if (!auth) return demoAuth.signUp(email);
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user);
  return credential.user;
}

export async function logout() {
  if (!auth) return demoAuth.signOut();
  return signOut(auth);
}

export async function resetPassword(email) {
  if (!auth) return true;
  return sendPasswordResetEmail(auth, email);
}

export function observeAuth(callback) {
  if (!auth) {
    callback(demoAuth.current());
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
