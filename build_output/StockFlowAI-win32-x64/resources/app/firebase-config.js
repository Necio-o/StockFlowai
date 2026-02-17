import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Cargar credenciales desde variables de entorno O valores por defecto si no existen
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCumYLCduzUxi9xlQE25Oi3x2WdrHoQjyw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "stockflow-ai-486913.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "stockflow-ai-486913",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "stockflow-ai-486913.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "834137563704",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:834137563704:web:befe747bbe8318ecdc7ccd",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LKZK7NE18P"
};

// Validar que las variables de entorno estén configuradas
if (!firebaseConfig.apiKey) {
  console.error("❌ ERROR: Firebase credentials not configured. Please set up .env file");
  console.error("📋 Copy .env.example to .env and fill with your credentials");
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// FUNCIÓN PARA LOGUEARSE CON GOOGLE
export const loginConGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("✅ Usuario conectado:", user.displayName);
    return user;
  } catch (error) {
    console.error("❌ Error al autenticar:", error.message);
    throw error;
  }
};