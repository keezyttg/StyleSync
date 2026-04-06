import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

export async function getCommunities() {
  const snap = await getDocs(collection(db, 'communities'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function searchCommunities(term: string) {
  // Basic client-side filter — upgrade to Algolia/Typesense for production
  const all = await getCommunities();
  const lower = term.toLowerCase();
  return all.filter((c: any) =>
    c.name.toLowerCase().includes(lower) ||
    c.description.toLowerCase().includes(lower)
  );
}

export async function getCommunity(id: string) {
  const snap = await getDoc(doc(db, 'communities', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getCommunityOutfits(communityId: string) {
  const q = query(
    collection(db, 'outfits'),
    where('communityId', '==', communityId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
