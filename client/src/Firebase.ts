import app from "firebase/app";
import "firebase/auth";
import "firebase/firebase-firestore";
import "firebase/storage";

const firebase = app.initializeApp({
  apiKey: "AIzaSyBdh_RPMd4bWzhWwBFrq-1jCbE-YVoEu3k",
  authDomain: "collaborative-teaching.firebaseapp.com",
  databaseURL: "https://collaborative-teaching.firebaseio.com",
  projectId: "collaborative-teaching",
  storageBucket: "collaborative-teaching.appspot.com",
  messagingSenderId: "165250393917",
  appId: "1:165250393917:web:3c80eb525febc903908754",
  measurementId: "G-JHBH418GRJ"
});

export const AUTH = firebase.auth();
