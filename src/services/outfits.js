import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  query,
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
  const q = query(collection(db, 'outfits'), limit(limitCount * 3));
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return docs
    .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
    .slice(0, limitCount);
}

// score = (avgRating * ratingCount + saves * 0.5) / (hoursOld + 2)^1.5
function hotScore(doc) {
  const now = Date.now() / 1000;
  const created = doc.createdAt?.seconds ?? now;
  const hoursOld = Math.max(0, (now - created) / 3600);
  const engagement = (doc.avgRating ?? 0) * (doc.ratingCount ?? 0) + (doc.saves ?? 0) * 0.5;
  return engagement / Math.pow(hoursOld + 2, 1.5);
}

export async function getOutfitsByFilter(filter = 'Hot', limitCount = 30) {
  const q = query(collection(db, 'outfits'), limit(limitCount * 3));
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  let sorted;
  switch (filter) {
    case 'New':
      sorted = docs.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      break;
    case 'Top':
      sorted = docs.sort((a, b) => {
        const ratingDiff = (b.avgRating ?? 0) - (a.avgRating ?? 0);
        return ratingDiff !== 0 ? ratingDiff : (b.ratingCount ?? 0) - (a.ratingCount ?? 0);
      });
      break;
    case 'Rising': {
      const sevenDaysAgo = Date.now() / 1000 - 7 * 24 * 3600;
      sorted = docs
        .filter(d => (d.createdAt?.seconds ?? 0) > sevenDaysAgo)
        .sort((a, b) => ((b.ratingCount ?? 0) + (b.saves ?? 0)) - ((a.ratingCount ?? 0) + (a.saves ?? 0)));
      break;
    }
    case 'Controversial':
      // High rating count but low average — lots of opinions, divided results
      sorted = docs
        .filter(d => (d.ratingCount ?? 0) >= 2)
        .sort((a, b) => {
          const scoreA = (a.ratingCount ?? 0) / Math.pow((a.avgRating ?? 0) + 1, 2);
          const scoreB = (b.ratingCount ?? 0) / Math.pow((b.avgRating ?? 0) + 1, 2);
          return scoreB - scoreA;
        });
      break;
    case 'Hot':
    default:
      sorted = docs.sort((a, b) => hotScore(b) - hotScore(a));
      break;
  }

  return sorted.slice(0, limitCount);
}

export async function getCommunityOutfits(communityId = null, limitCount = 20) {
  const constraints = [];
  if (communityId) constraints.push(where('communityId', '==', communityId));
  if (typeof limitCount === 'number') {
    constraints.push(limit(communityId ? limitCount : limitCount * 3));
  }
  const snap = await getDocs(query(collection(db, 'outfits'), ...constraints));
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const sorted = docs.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  return typeof limitCount === 'number' ? sorted.slice(0, limitCount) : sorted;
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

export async function getUserRating(outfitId, userId) {
  try {
    const snap = await getDoc(doc(db, 'outfits', outfitId, 'ratings', userId));
    return snap.exists() ? snap.data().value : 0;
  } catch {
    return 0;
  }
}

export async function rateOutfit(outfitId, userId, value) {
  const ratingRef = doc(db, 'outfits', outfitId, 'ratings', userId);

  await runTransaction(db, async (tx) => {
    const outfitRef = doc(db, 'outfits', outfitId);
    const outfitSnap = await tx.get(outfitRef);
    const ratingSnap = await tx.get(ratingRef);

    if (!outfitSnap.exists()) throw new Error('Outfit not found');

    const outfit = outfitSnap.data();
    const isReRate = ratingSnap.exists();
    const oldValue = isReRate ? ratingSnap.data().value : 0;

    // Update outfit rating
    let newOutfitTotal = outfit.ratingTotal - oldValue + value;
    let newOutfitCount = isReRate ? outfit.ratingCount : outfit.ratingCount + 1;
    const newOutfitAvg = newOutfitCount > 0 ? newOutfitTotal / newOutfitCount : 0;

    tx.set(ratingRef, { userId, outfitId, value, createdAt: serverTimestamp() });
    tx.update(outfitRef, {
      ratingTotal: newOutfitTotal,
      ratingCount: newOutfitCount,
      avgRating: Math.round(newOutfitAvg * 10) / 10,
    });

    // Update outfit owner's profile avgRating
    const ownerId = outfit.userId;
    if (ownerId) {
      const userRef = doc(db, 'users', ownerId);
      const userSnap = await tx.get(userRef);
      if (userSnap.exists()) {
        const u = userSnap.data();
        const uTotal = (u.ratingTotal ?? 0) - oldValue + value;
        const uCount = isReRate ? (u.ratingCount ?? 0) : (u.ratingCount ?? 0) + 1;
        const uAvg = uCount > 0 ? Math.round((uTotal / uCount) * 10) / 10 : 0;
        tx.update(userRef, { ratingTotal: uTotal, ratingCount: uCount, avgRating: uAvg });
      }
    }
  });
}

export async function deleteOutfit(outfitId, userId) {
  if (!outfitId) throw new Error('Missing outfit ID');
  await deleteDoc(doc(db, 'outfits', outfitId));
  // Best-effort — don't block deletion if user doc update fails
  try {
    await updateDoc(doc(db, 'users', userId), { outfitCount: increment(-1) });
  } catch {
    // user doc may not exist for seeded/demo posts — ignore
  }
}

export async function getSavedOutfits(userId) {
  const savedSnap = await getDocs(collection(db, 'users', userId, 'saved'));
  // Deduplicate by outfitId and silently clean up any duplicate save docs
  const seen = new Set();
  const uniqueIds = [];
  const duplicates = [];
  for (const d of savedSnap.docs) {
    const id = d.data().outfitId;
    if (!id) { duplicates.push(d); continue; }
    if (seen.has(id)) { duplicates.push(d); }
    else { seen.add(id); uniqueIds.push(id); }
  }
  if (duplicates.length > 0) {
    Promise.all(duplicates.map(d => deleteDoc(d.ref))).catch(() => {});
  }
  if (uniqueIds.length === 0) return [];
  const outfits = await Promise.all(
    uniqueIds.map(id => getDoc(doc(db, 'outfits', id)).then(s => s.exists() ? { id: s.id, ...s.data() } : null))
  );
  return outfits.filter(Boolean);
}

export async function unsaveOutfit(userId, outfitId) {
  // Delete ALL save docs for this outfit (handles any duplicates)
  const savedSnap = await getDocs(
    query(collection(db, 'users', userId, 'saved'), where('outfitId', '==', outfitId))
  );
  await Promise.all(savedSnap.docs.map(d => deleteDoc(d.ref)));
}

export async function isSaved(userId, outfitId) {
  const snap = await getDocs(
    query(collection(db, 'users', userId, 'saved'), where('outfitId', '==', outfitId), limit(1))
  );
  return !snap.empty;
}

export async function reportOutfit(outfitId, reporterUid, reportedUserId, reason) {
  await addDoc(collection(db, 'reports'), {
    outfitId,
    reporterUid,
    reportedUserId,
    reason,
    createdAt: serverTimestamp(),
  });
}

export async function saveOutfit(userId, outfitId, outfitOwnerId) {
  const already = await isSaved(userId, outfitId);
  if (already) return;
  await addDoc(collection(db, 'users', userId, 'saved'), {
    outfitId,
    savedAt: serverTimestamp(),
  });
  // Only increment saves count for other people's outfits (owner saving own post shouldn't inflate count)
  if (outfitOwnerId && userId !== outfitOwnerId) {
    await updateDoc(doc(db, 'outfits', outfitId), {
      saves: increment(1),
    });
  }
}
