import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { ClothingItem } from '../types';

export async function uploadItemImage(uri: string, userId: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = `closet/${userId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function addClothingItem(data: {
  userId: string;
  name: string;
  brand?: string;
  category: ClothingItem['category'];
  size?: string;
  price?: number;
  tags: string[];
  imageURL: string;
}) {
  const docRef = await addDoc(collection(db, 'users', data.userId, 'closet'), {
    ...data,
    wornCount: 0,
    costPerWear: data.price ?? 0,
    addedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getClosetItems(userId: string, category?: ClothingItem['category']) {
  let q = query(
    collection(db, 'users', userId, 'closet'),
    orderBy('addedAt', 'desc')
  );

  if (category) {
    q = query(
      collection(db, 'users', userId, 'closet'),
      where('category', '==', category),
      orderBy('addedAt', 'desc')
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as (ClothingItem & { id: string })[];
}

export async function incrementWornCount(userId: string, itemId: string, price: number, currentWorn: number) {
  const newWorn = currentWorn + 1;
  const costPerWear = price > 0 ? Math.round((price / newWorn) * 100) / 100 : 0;
  await updateDoc(doc(db, 'users', userId, 'closet', itemId), {
    wornCount: newWorn,
    costPerWear,
  });
}

export async function deleteClothingItem(userId: string, itemId: string) {
  await deleteDoc(doc(db, 'users', userId, 'closet', itemId));
}
