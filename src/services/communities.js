import {
  collection, getDocs, doc, getDoc, addDoc,
  setDoc, deleteDoc, query, where, serverTimestamp,
  updateDoc, increment,
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
  const memberRef = doc(db, 'communities', communityId, 'members', userId);
  const existing = await getDoc(memberRef);
  if (existing.exists()) return; // already a member — don't double-increment
  await setDoc(memberRef, { joinedAt: serverTimestamp() });
  await updateDoc(doc(db, 'communities', communityId), { memberCount: increment(1) });
}

export async function leaveCommunity(communityId, userId) {
  const memberRef = doc(db, 'communities', communityId, 'members', userId);
  const existing = await getDoc(memberRef);
  if (!existing.exists()) return; // not a member — don't double-decrement
  await deleteDoc(memberRef);
  await updateDoc(doc(db, 'communities', communityId), { memberCount: increment(-1) });
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
