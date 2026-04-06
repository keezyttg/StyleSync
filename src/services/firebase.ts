import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDXrN49fgvQxMhIyGYbbgMTFs1G2IJ7Pe0",
  authDomain: "stylesync-619ee.firebaseapp.com",
  projectId: "stylesync-619ee",
  storageBucket: "stylesync-619ee.firebasestorage.app",
  messagingSenderId: "919194196963",
  appId: "1:919194196963:web:0ac549119c063683bc1ed6",
  measurementId: "G-H0RT98J8LE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
