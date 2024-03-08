// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

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
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();