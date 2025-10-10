// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, FacebookAuthProvider, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCz3llKgPfyKqwl_CJnX1O5mFAdZHIuUao",
  authDomain: "anbiweb.firebaseapp.com",
  projectId: "anbiweb",
  storageBucket: "anbiweb.firebasestorage.app",
  messagingSenderId: "559789846661",
  appId: "1:559789846661:web:ec068bd7f1fe1d481c39ec",
  measurementId: "G-81HZ53S3L1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Auth Providers
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app;