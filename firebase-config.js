// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCTREufIU4eniPzZoUpaIl0ka--dHZPdmE",
  authDomain: "leishcheck-c927c.firebaseapp.com",
  projectId: "leishcheck-c927c",
  storageBucket: "leishcheck-c927c.firebasestorage.app",
  messagingSenderId: "86022380552",
  appId: "1:86022380552:web:5ab8ec1696ff7fb78d45bd",
  measurementId: "G-0ZTZPR0LJM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);