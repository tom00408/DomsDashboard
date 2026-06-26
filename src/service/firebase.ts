import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyCPB_amSoR8k2NK59asbZAMAzSepiEG40Q',
  authDomain: 'mtvgeismar-3bf45.firebaseapp.com',
  databaseURL: 'https://mtvgeismar-3bf45-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'mtvgeismar-3bf45',
  storageBucket: 'mtvgeismar-3bf45.firebasestorage.app',
  messagingSenderId: '346780246742',
  appId: '1:346780246742:web:16136e9150e4c844881f77',
};

const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(firebaseApp);
const db: Firestore = getFirestore(firebaseApp);
const functions: Functions = getFunctions(firebaseApp, 'europe-west3');
const storage: FirebaseStorage = getStorage(firebaseApp);

export default firebaseApp;
export { db, auth, functions, storage };

