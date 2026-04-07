import {
  collection,
  addDoc,
  getDocs,
  doc,
  query,
  orderBy,
  where,
  limit,
  updateDoc,
  increment,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

export async function uploadOutfitImage(uri, userId) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = `outfits/${userId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function createOutfit(data) {
  const docRef = await addDoc(collection(db, 'outfits'), {
    ...data,
    ratingTotal: 0,
    ratingCount: 0,
    avgRating: 0,
    saves: 0,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'users', data.userId), {
    outfitCount: increment(1),
  });

  return docRef.id;
}

export async function getTrendingOutfits(limitCount = 20) {
  const q = query(
    collection(db, 'outfits'),
    orderBy('avgRating', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getCommunityOutfits(limitCount = 20) {
  const q = query(
    collection(db, 'outfits'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUserOutfits(userId) {
  const q = query(
    collection(db, 'outfits'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
}

export async function rateOutfit(outfitId, userId, value) {
  const ratingRef = doc(db, 'outfits', outfitId, 'ratings', userId);

  await runTransaction(db, async (tx) => {
    const outfitRef = doc(db, 'outfits', outfitId);
    const outfitSnap = await tx.get(outfitRef);
    const ratingSnap = await tx.get(ratingRef);

    if (!outfitSnap.exists()) throw new Error('Outfit not found');

    const outfit = outfitSnap.data();
    let newTotal = outfit.ratingTotal;
    let newCount = outfit.ratingCount;

    if (ratingSnap.exists()) {
      const oldValue = ratingSnap.data().value;
      newTotal = newTotal - oldValue + value;
    } else {
      newTotal += value;
      newCount += 1;
    }

    const newAvg = newCount > 0 ? newTotal / newCount : 0;

    tx.set(ratingRef, { userId, outfitId, value, createdAt: serverTimestamp() });
    tx.update(outfitRef, {
      ratingTotal: newTotal,
      ratingCount: newCount,
      avgRating: Math.round(newAvg * 10) / 10,
    });
  });
}

export async function saveOutfit(userId, outfitId) {
  await addDoc(collection(db, 'users', userId, 'saved'), {
    outfitId,
    savedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'outfits', outfitId), {
    saves: increment(1),
  });
}
