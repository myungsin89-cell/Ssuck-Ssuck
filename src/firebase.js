// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyB93b-iCOzIEOFtMkAy3WebCDnrgMWdLtA",
    authDomain: "gen-lang-client-0875202057.firebaseapp.com",
    projectId: "gen-lang-client-0875202057",
    storageBucket: "gen-lang-client-0875202057.firebasestorage.app",
    messagingSenderId: "977947510006",
    appId: "1:977947510006:web:f478ff9a2253a0544e98d7",
    measurementId: "G-K8PH5P9P22"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
