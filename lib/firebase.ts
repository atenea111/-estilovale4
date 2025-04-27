import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAuth } from "firebase/auth"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBd0TYEYGhpG2pl1z2iXPazFj7Zl2Ore74",
  authDomain: "bartest-ea852.firebaseapp.com",
  projectId: "bartest-ea852",
  storageBucket: "bartest-ea852.appspot.com",
  messagingSenderId: "292123662270",
  appId: "1:292123662270:web:c5a1263a8cda52afb08bef",
}

// Initialize Firebase
export const initializeFirebase = async () => {
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  const storage = getStorage(app)
  const auth = getAuth(app)

  return { db, storage, auth, app }
}
