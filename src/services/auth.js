import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, serverTimestamp, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';

export async function uploadProfileImage(uri, uid) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `avatars/${uid}/profile.jpg`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function signUp(email, password, username) {
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

export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logOut() {
  await signOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid, updates) {
  await updateDoc(doc(db, 'users', uid), updates);
  if (updates.displayName || updates.photoURL) {
    await updateProfile(auth.currentUser, {
      displayName: updates.displayName,
      photoURL: updates.photoURL,
    });
  }
}

export async function getFollowing(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'following'));
  return snap.docs.map(d => d.id);
}

export async function followUser(currentUid, targetUid) {
  await setDoc(doc(db, 'users', currentUid, 'following', targetUid), { followedAt: serverTimestamp() });
  await setDoc(doc(db, 'users', targetUid, 'followers', currentUid), { followedAt: serverTimestamp() });
  await updateDoc(doc(db, 'users', currentUid), { following: increment(1) });
  await updateDoc(doc(db, 'users', targetUid), { followers: increment(1) });
}

export async function unfollowUser(currentUid, targetUid) {
  await deleteDoc(doc(db, 'users', currentUid, 'following', targetUid));
  await deleteDoc(doc(db, 'users', targetUid, 'followers', currentUid));
  await updateDoc(doc(db, 'users', currentUid), { following: increment(-1) });
  await updateDoc(doc(db, 'users', targetUid), { followers: increment(-1) });
}
