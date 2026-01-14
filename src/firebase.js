import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
    apiKey: "AIzaSyAqAy0hG4B0eOOtnvbfwiBM92U_UImCx7E",
    authDomain: "hospitalparking-99bca.firebaseapp.com",
    projectId: "hospitalparking-99bca",
    storageBucket: "hospitalparking-99bca.firebasestorage.app",
    messagingSenderId: "1079664336682",
    appId: "1:1079664336682:web:70f23a3c17300fd00fc853",
    measurementId: "G-574KT7199N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
