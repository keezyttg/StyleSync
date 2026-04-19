import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

export async function uploadItemImage(uri, userId) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = `closet/${userId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function addClothingItem(data) {
  const docRef = await addDoc(collection(db, 'users', data.userId, 'closet'), {
    ...data,
    wornCount: 0,
    costPerWear: data.price ?? 0,
    addedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getClosetItems(userId, category) {
  let q;
  if (category) {
    q = query(
      collection(db, 'users', userId, 'closet'),
      where('category', '==', category)
    );
  } else {
    q = query(collection(db, 'users', userId, 'closet'));
  }
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => (b.addedAt?.seconds ?? 0) - (a.addedAt?.seconds ?? 0));
}

export async function incrementWornCount(userId, itemId, price, currentWorn) {
  const newWorn = currentWorn + 1;
  const costPerWear = price > 0 ? Math.round((price / newWorn) * 100) / 100 : 0;
  await updateDoc(doc(db, 'users', userId, 'closet', itemId), {
    wornCount: newWorn,
    costPerWear,
  });
}

export async function decrementWornCount(userId, itemId, price, currentWorn) {
  const newWorn = Math.max(0, currentWorn - 1);
  const costPerWear = price > 0 && newWorn > 0 ? Math.round((price / newWorn) * 100) / 100 : price ?? 0;
  await updateDoc(doc(db, 'users', userId, 'closet', itemId), {
    wornCount: newWorn,
    costPerWear,
  });
}

export async function updateClothingItem(userId, itemId, updates) {
  const { price, wornCount } = updates;
  const costPerWear =
    price > 0 && wornCount > 0 ? Math.round((price / wornCount) * 100) / 100 : price ?? 0;
  await updateDoc(doc(db, 'users', userId, 'closet', itemId), { ...updates, costPerWear });
}

export async function deleteClothingItem(userId, itemId) {
  await deleteDoc(doc(db, 'users', userId, 'closet', itemId));
}

export async function getCustomTags(userId) {
  const snap = await getDoc(doc(db, 'users', userId, 'settings', 'tags'));
  return snap.exists() ? (snap.data().labels ?? []) : [];
}

export async function saveCustomTags(userId, tags) {
  await setDoc(doc(db, 'users', userId, 'settings', 'tags'), { labels: tags }, { merge: true });
}
