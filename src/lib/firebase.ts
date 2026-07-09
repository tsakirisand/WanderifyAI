import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkCJxIyXUMDONgbdI2ZShEIVVzH3bQe8w",
  authDomain: "ai-travel-planner-ffa80.firebaseapp.com",
  projectId: "ai-travel-planner-ffa80",
  storageBucket: "ai-travel-planner-ffa80.firebasestorage.app",
  messagingSenderId: "136116508482",
  appId: "1:136116508482:web:fcb208607c303a1348dadb",
  measurementId: "G-VG9SXJKNQT"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
