import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCumYLCduzUxi9xlQE25Oi3x2WdrHoQjyw",
  authDomain: "stockflow-ai-486913.firebaseapp.com",
  projectId: "stockflow-ai-486913",
  storageBucket: "stockflow-ai-486913.firebasestorage.app",
  messagingSenderId: "834137563704",
  appId: "1:834137563704:web:befe747bbe8318ecdc7ccd",
  measurementId: "G-LKZK7NE18P"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
