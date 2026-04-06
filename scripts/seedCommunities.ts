/**
 * Run once to seed default communities:
 *   npx ts-node scripts/seedCommunities.ts
 *
 * Requires: npm install -D ts-node @types/node
 * And your firebase.ts must have real credentials.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  // Paste your config here or import from src/services/firebase.ts
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const communities = [
  { name: 'NYC Fashion', description: 'Fashion style from NYC', tags: ['streetwear', 'urban'], memberCount: 0, postCount: 0 },
  { name: 'High Fashion', description: 'Designer brands only fashion', tags: ['luxury', 'designer'], memberCount: 0, postCount: 0 },
  { name: 'Cosplay', description: 'Be your favorite character', tags: ['cosplay', 'anime', 'gaming'], memberCount: 0, postCount: 0 },
  { name: "90's Fashion", description: "Only styles from the 90's", tags: ['vintage', '90s', 'retro'], memberCount: 0, postCount: 0 },
  { name: "Halloween's Best", description: 'Best October 31st Fits', tags: ['halloween', 'costume'], memberCount: 0, postCount: 0 },
  { name: 'Runway Style', description: 'Fits that belong on the runway', tags: ['runway', 'editorial'], memberCount: 0, postCount: 0 },
  { name: 'Streetwear', description: 'Hypebeast and street culture fits', tags: ['streetwear', 'sneakers'], memberCount: 0, postCount: 0 },
  { name: 'Minimalist', description: 'Less is more', tags: ['minimalist', 'clean', 'neutral'], memberCount: 0, postCount: 0 },
];

async function seed() {
  for (const community of communities) {
    const ref = await addDoc(collection(db, 'communities'), community);
    console.log(`Created: ${community.name} (${ref.id})`);
  }
  console.log('Done!');
  process.exit(0);
}

seed().catch(console.error);
