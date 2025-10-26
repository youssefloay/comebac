import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore, initializeFirestore, persistentLocalCache, Firestore } from "firebase/firestore"
import { getAnalytics, isSupported } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyAXpEoCb7xwHYgeprZ6CYpMRxZ1MAookSE",
  authDomain: "scolar-league.firebaseapp.com",
  projectId: "scolar-league",
  storageBucket: "scolar-league.firebasestorage.app",
  messagingSenderId: "839839749098",
  appId: "1:839839749098:web:5353561c4f4673cdab9893",
  measurementId: "G-F0EREB6993"
}

let app;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } else {
    app = getApps()[0];
    console.log('Using existing Firebase app');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

export const auth = getAuth(app);

let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache()
  });
  console.log('Firestore initialized successfully with persistent cache');
} catch (error) {
  console.error('Error initializing Firestore:', error);
  throw error;
}
export { db }

let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
        console.log('Analytics initialized successfully');
      } catch (error) {
        console.error('Error initializing Analytics:', error);
      }
    }
  });
}
export { analytics }