import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export async function signUp(email: string, password: string, username: string): Promise<FirebaseUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: username });

  await setDoc(doc(db, 'users', credential.user.uid), {
    uid: credential.user.uid,
    username,
    displayName: username,
    email,
    photoURL: null,
    bio: '',
    followers: 0,
    following: 0,
    outfitCount: 0,
    avgRating: 0,
    createdAt: serverTimestamp(),
  });

  return credential.user;
}

export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserProfile(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}
