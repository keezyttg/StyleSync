import {
  collection, getDocs, doc, getDoc, addDoc,
  setDoc, deleteDoc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export async function getCommunities() {
  const snap = await getDocs(collection(db, 'communities'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function searchCommunities(term) {
  const all = await getCommunities();
  const lower = term.toLowerCase();
  return all.filter(c =>
    c.name.toLowerCase().includes(lower) ||
    (c.description ?? '').toLowerCase().includes(lower)
  );
}

export async function getCommunity(id) {
  const snap = await getDoc(doc(db, 'communities', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createCommunity(data) {
  const ref = await addDoc(collection(db, 'communities'), {
    ...data,
    memberCount: 1,
    postCount: 0,
    createdAt: serverTimestamp(),
  });
  // Creator auto-joins
  await setDoc(doc(db, 'communities', ref.id, 'members', data.createdBy), {
    joinedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function joinCommunity(communityId, userId) {
  await setDoc(doc(db, 'communities', communityId, 'members', userId), {
    joinedAt: serverTimestamp(),
  });
  // best-effort increment
  try {
    const { updateDoc, increment } = await import('firebase/firestore');
    await updateDoc(doc(db, 'communities', communityId), { memberCount: increment(1) });
  } catch {}
}

export async function leaveCommunity(communityId, userId) {
  await deleteDoc(doc(db, 'communities', communityId, 'members', userId));
  try {
    const { updateDoc, increment } = await import('firebase/firestore');
    await updateDoc(doc(db, 'communities', communityId), { memberCount: increment(-1) });
  } catch {}
}

export async function isJoined(communityId, userId) {
  const snap = await getDoc(doc(db, 'communities', communityId, 'members', userId));
  return snap.exists();
}

export async function getUserCommunities(userId) {
  const all = await getCommunities();
  const joined = await Promise.all(
    all.map(async c => {
      const snap = await getDoc(doc(db, 'communities', c.id, 'members', userId));
      return snap.exists() ? c : null;
    })
  );
  return joined.filter(Boolean);
}
