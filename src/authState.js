// src/authState.js
import { ref } from 'vue';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

const user = ref(null);

onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser;
});

export { user };
