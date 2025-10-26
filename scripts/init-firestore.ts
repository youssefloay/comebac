import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function initializeFirestore() {
  console.log("[v0] Starting Firestore initialization...")

  try {
    // Check if collections exist by trying to read from them
    const collections = ["teams", "players", "matches", "results", "statistics", "users"]

    for (const collectionName of collections) {
      try {
        const snapshot = await getDocs(collection(db, collectionName))
        console.log(`[v0] Collection '${collectionName}' exists with ${snapshot.size} documents`)
      } catch (error) {
        console.log(`[v0] Collection '${collectionName}' will be created on first write`)
      }
    }

    console.log("[v0] Firestore initialization complete!")
    console.log("[v0] Collections will be automatically created when you add data")
    console.log("[v0] Remember to set up Firestore Security Rules in the Firebase Console:")
    console.log(`
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Allow authenticated users to read/write their own data
        match /teams/{document=**} {
          allow read, write: if request.auth != null;
        }
        match /players/{document=**} {
          allow read, write: if request.auth != null;
        }
        match /matches/{document=**} {
          allow read, write: if request.auth != null;
        }
        match /results/{document=**} {
          allow read, write: if request.auth != null;
        }
        match /statistics/{document=**} {
          allow read, write: if request.auth != null;
        }
        match /users/{document=**} {
          allow read, write: if request.auth != null && request.auth.uid == resource.id;
        }
      }
    }
    `)
  } catch (error) {
    console.error("[v0] Error during Firestore initialization:", error)
    throw error
  }
}

initializeFirestore()
