import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0P-cJ1LJq7tB9IJQV4kOTELZTLZamSBE",
  authDomain: "dengue-crud-app.firebaseapp.com",
  projectId: "dengue-crud-app",
  storageBucket: "dengue-crud-app.firebasestorage.app",
  messagingSenderId: "565321192160",
  appId: "1:565321192160:web:abf08a5da9571f94f5b685",
  measurementId: "G-2VQMHWCP76"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
