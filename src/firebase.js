// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCPB_amSoR8k2NK59asbZAMAzSepiEG40Q",
    authDomain: "mtvgeismar-3bf45.firebaseapp.com",
    databaseURL: "https://mtvgeismar-3bf45-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "mtvgeismar-3bf45",
    storageBucket: "mtvgeismar-3bf45.firebasestorage.app",
    messagingSenderId: "346780246742",
    appId: "1:346780246742:web:16136e9150e4c844881f77"
  };

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp)
const db = getFirestore(firebaseApp);

export default firebaseApp;
export  {db , auth};
