// Import the functions you need from the SDKs you need
import { getFirestore } from "@firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKRKK5rTM_QOPuyhBkPpzkyyH18Z1xSSk",
  authDomain: "flavorfolio-eaecb.firebaseapp.com",
  projectId: "flavorfolio-eaecb",
  storageBucket: "flavorfolio-eaecb.appspot.com",
  messagingSenderId: "1048396326556",
  appId: "1:1048396326556:web:3791ad6a833e03267bef59"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export default app

