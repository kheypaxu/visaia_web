// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDczAP8kFRapwF6Fneqswnk9ixyZCagjIA",
    authDomain: "visaia.firebaseapp.com",
    projectId: "visaia",
    storageBucket: "visaia.firebasestorage.app",
    messagingSenderId: "838623846602",
    appId: "1:838623846602:web:50927a20b2680c70895433",
    measurementId: "G-0DYDHTV5BL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);