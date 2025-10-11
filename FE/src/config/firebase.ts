// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, FacebookAuthProvider, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyCz3llKgPfyKqwl_CJnX1O5mFAdZHIuUao",
  authDomain: "anbiweb.firebaseapp.com",
  projectId: "anbiweb",
  storageBucket: "anbiweb.firebasestorage.app",
  messagingSenderId: "559789846661",
  appId: "1:559789846661:web:ec068bd7f1fe1d481c39ec",
  measurementId: "G-81HZ53S3L1"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services
export const analytics: Analytics = getAnalytics(app);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Initialize Auth Providers
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app;