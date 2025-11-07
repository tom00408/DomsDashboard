import { ref } from 'vue';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';

const user = ref<User | null>(null);
const isAuthReady = ref(false);

onAuthStateChanged(auth, (firebaseUser) => {
	user.value = firebaseUser;
	isAuthReady.value = true;
});

export { user, isAuthReady };

