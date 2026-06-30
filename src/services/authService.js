import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/firebaseConfig";

export async function registerWithEmailPassword(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = userCredential.user;

  const userData = {
    uid,
    email,
    role: "user",
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", uid), userData);

  return { uid, ...userData, createdAt: new Date().toISOString() };
}

export async function loginWithEmailPassword(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const { uid } = userCredential.user;

  const userDoc = await getDoc(doc(db, "users", uid));

  if (!userDoc.exists()) {
    const userData = {
      uid,
      email,
      role: "user",
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", uid), userData);
    return { uid, ...userData, createdAt: new Date().toISOString() };
  }

  return { uid, ...userDoc.data(), id: uid };
}

export async function logout() {
  await signOut(auth);
}

export async function loginWithGoogle() {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const { uid, email } = userCredential.user;

  const userDoc = await getDoc(doc(db, "users", uid));

  if (!userDoc.exists()) {
    const userData = {
      uid,
      email,
      role: "user",
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", uid), userData);
    return { uid, ...userData, createdAt: new Date().toISOString() };
  }

  return { uid, ...userDoc.data(), id: uid };
}

export async function getUserData(uid) {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return null;
  return { uid, ...userDoc.data(), id: uid };
}
