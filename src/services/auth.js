import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocFromServer, updateDoc, deleteDoc, collection, getDocs, serverTimestamp, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useEffect, useState } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { auth, db, storage } from './firebase';
import { getUserPushToken, sendPushNotification, saveNotification } from './notifications';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = '919194196963-8jiljrqft7ujo9bnp6rhe3jn7db4rsn0.apps.googleusercontent.com';
const IOS_CLIENT_ID = '499566507317-kcql19nkcks9rc3jmlmtsvbnvk0fjlvp.apps.googleusercontent.com';

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
  const snap = await getDocFromServer(doc(db, 'users', uid));
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

export async function searchUsers(term) {
  const snap = await getDocs(collection(db, 'users'));
  const lower = term.toLowerCase();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(u =>
      (u.username ?? '').toLowerCase().includes(lower) ||
      (u.displayName ?? '').toLowerCase().includes(lower)
    );
}

export async function getFollowers(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'followers'));
  return snap.docs.map(d => d.id);
}

export async function followUser(currentUid, targetUid) {
  // Core writes — must succeed for the follow to be saved
  await setDoc(doc(db, 'users', currentUid, 'following', targetUid), { followedAt: serverTimestamp() });
  await setDoc(doc(db, 'users', targetUid, 'followers', currentUid), { followedAt: serverTimestamp() });

  // Best-effort counter increments — don't let failures roll back the follow
  try {
    await updateDoc(doc(db, 'users', currentUid), { following: increment(1) });
    await updateDoc(doc(db, 'users', targetUid), { followers: increment(1) });
  } catch {}

  // Fire-and-forget notifications — never block or fail the follow
  getDoc(doc(db, 'users', currentUid))
    .then(followerSnap => {
      const followerData = followerSnap.data() ?? {};
      const followerName = followerData.displayName || followerData.username || 'Someone';
      getUserPushToken(targetUid).then(token => {
        sendPushNotification(token, 'New Follower', `${followerName} started following you`);
        saveNotification(targetUid, {
          type: 'follow',
          fromUid: currentUid,
          fromName: followerName,
          fromPhoto: followerData.photoURL ?? null,
          message: `${followerName} started following you`,
          outfitId: null,
          outfitImage: null,
        });
      });
    })
    .catch(() => {});
}

export function useGoogleSignIn() {
  const [request, response, promptAsync] = Google.useAuthRequest({ webClientId: WEB_CLIENT_ID, iosClientId: IOS_CLIENT_ID });
  const [googleError, setGoogleError] = useState(null);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).catch(() => {
        setGoogleError('Google sign-in failed. Please try again.');
      });
    }
  }, [response]);

  return { request, promptAsync, googleError };
}

export async function unfollowUser(currentUid, targetUid) {
  await deleteDoc(doc(db, 'users', currentUid, 'following', targetUid));
  await deleteDoc(doc(db, 'users', targetUid, 'followers', currentUid));
  try {
    await updateDoc(doc(db, 'users', currentUid), { following: increment(-1) });
    await updateDoc(doc(db, 'users', targetUid), { followers: increment(-1) });
  } catch {}
}
