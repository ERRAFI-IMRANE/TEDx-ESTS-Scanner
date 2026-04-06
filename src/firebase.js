// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCRmU1UGp806KHQ725xVHdlEiaGmq3W1hg",
  authDomain: "tedx-voting.firebaseapp.com",
  databaseURL: "https://tedx-voting-default-rtdb.firebaseio.com",
  projectId: "tedx-voting",
  storageBucket: "tedx-voting.firebasestorage.app",
  messagingSenderId: "9730341427",
  appId: "1:9730341427:web:9fb88ede0ead7261b7c146",
  measurementId: "G-RN99LZLKP8",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();