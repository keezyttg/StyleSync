/**
 * Seed script — populates Firestore with demo outfits so new users
 * see a real feed instead of a blank screen.
 *
 * Usage (run once from project root):
 *   node scripts/seedFeed.js
 *
 * Requires: npm install firebase (already in package.json)
 * Uses public Unsplash source URLs — no Storage upload needed.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDXrN49fgvQxMhIyGYbbgMTFs1G2IJ7Pe0",
  authDomain: "stylesync-619ee.firebaseapp.com",
  projectId: "stylesync-619ee",
  storageBucket: "stylesync-619ee.firebasestorage.app",
  messagingSenderId: "919194196963",
  appId: "1:919194196963:web:0ac549119c063683bc1ed6",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Demo user accounts (these don't need to exist in Auth — just Firestore docs)
const DEMO_USERS = [
  { uid: 'demo_user_1', displayName: 'Jordan Lee', username: 'jordanlee', photoURL: null },
  { uid: 'demo_user_2', displayName: 'Alex Rivera', username: 'alexrivera', photoURL: null },
  { uid: 'demo_user_3', displayName: 'Sam Chen', username: 'samchen', photoURL: null },
  { uid: 'demo_user_4', displayName: 'Morgan K', username: 'morgank', photoURL: null },
  { uid: 'demo_user_5', displayName: 'Riley Moss', username: 'rileymoss', photoURL: null },
];

// Public fashion images from Unsplash (free to use)
const OUTFITS = [
  {
    userId: 'demo_user_1',
    displayName: 'Jordan Lee',
    imageURL: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600',
    caption: 'All black everything. Simple but never boring.',
    tags: ['Minimalist', 'Streetwear'],
    avgRating: 4.8, ratingTotal: 48, ratingCount: 10, saves: 23,
  },
  {
    userId: 'demo_user_2',
    displayName: 'Alex Rivera',
    imageURL: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600',
    caption: 'Thrifted this jacket for $12. Cost per wear is already under $1 lol',
    tags: ['Vintage', 'Casual'],
    avgRating: 4.5, ratingTotal: 45, ratingCount: 10, saves: 18,
  },
  {
    userId: 'demo_user_3',
    displayName: 'Sam Chen',
    imageURL: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600',
    caption: 'Business casual done right. Meeting in 20.',
    tags: ['Business Casual', 'Formal'],
    avgRating: 4.2, ratingTotal: 42, ratingCount: 10, saves: 11,
  },
  {
    userId: 'demo_user_4',
    displayName: 'Morgan K',
    imageURL: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600',
    caption: 'Summer fits incoming ☀️',
    tags: ['Summer', 'Casual'],
    avgRating: 4.6, ratingTotal: 46, ratingCount: 10, saves: 31,
  },
  {
    userId: 'demo_user_5',
    displayName: 'Riley Moss',
    imageURL: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600',
    caption: 'Runway vibes on a thrift store budget.',
    tags: ['Streetwear', 'Vintage'],
    avgRating: 4.9, ratingTotal: 49, ratingCount: 10, saves: 44,
  },
  {
    userId: 'demo_user_1',
    displayName: 'Jordan Lee',
    imageURL: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600',
    caption: 'Monochrome moment.',
    tags: ['Minimalist'],
    avgRating: 4.3, ratingTotal: 43, ratingCount: 10, saves: 15,
  },
  {
    userId: 'demo_user_2',
    displayName: 'Alex Rivera',
    imageURL: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600',
    caption: 'Fall is the best season for layering.',
    tags: ['Fall', 'Casual'],
    avgRating: 4.7, ratingTotal: 47, ratingCount: 10, saves: 27,
  },
  {
    userId: 'demo_user_3',
    displayName: 'Sam Chen',
    imageURL: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600',
    caption: 'Pink is always in season.',
    tags: ['Casual', 'Summer'],
    avgRating: 4.4, ratingTotal: 44, ratingCount: 10, saves: 19,
  },
  {
    userId: 'demo_user_4',
    displayName: 'Morgan K',
    imageURL: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600',
    caption: 'Athleisure never goes out of style.',
    tags: ['Athleisure'],
    avgRating: 4.1, ratingTotal: 41, ratingCount: 10, saves: 9,
  },
  {
    userId: 'demo_user_5',
    displayName: 'Riley Moss',
    imageURL: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600',
    caption: 'When the fit just works.',
    tags: ['Streetwear'],
    avgRating: 4.8, ratingTotal: 48, ratingCount: 10, saves: 38,
  },
];

async function seed() {
  console.log('Seeding demo users...');
  for (const user of DEMO_USERS) {
    await setDoc(doc(db, 'users', user.uid), {
      ...user,
      bio: '',
      followers: Math.floor(Math.random() * 500) + 50,
      following: Math.floor(Math.random() * 200) + 20,
      outfitCount: 0,
      avgRating: 0,
      createdAt: serverTimestamp(),
    });
    console.log(`  ✓ user: ${user.displayName}`);
  }

  console.log('\nSeeding outfits...');
  for (const outfit of OUTFITS) {
    await addDoc(collection(db, 'outfits'), {
      ...outfit,
      itemIds: [],
      createdAt: serverTimestamp(),
    });
    console.log(`  ✓ outfit by ${outfit.displayName}: "${outfit.caption.slice(0, 40)}..."`);
  }

  console.log('\nDone! Feed is seeded with', OUTFITS.length, 'outfits.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
