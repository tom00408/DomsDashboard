<template>
    <div class="hstack">
      <template v-if="!user">
        <input v-model="email" placeholder="E-Mail" @keydown.enter="login">
        <input v-model="password" type="password" placeholder="Passwort" @keydown.enter="login">
        <button @click="login">Login</button>
      </template>
      <template v-else>
        <span class="user-email">{{ user.email }}</span>
        <button @click="logout">Ausloggen</button>
      </template>
    </div>
    
    <!-- Fehler anzeigen, falls vorhanden -->
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
  import { auth } from '../firebase';
  import { user } from '../authState';
  
  const email = ref('');
  const password = ref('');
  const errorMessage = ref('');
  
  const login = async () => {
    errorMessage.value = ''; // Fehler zurücksetzen
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
      console.log('Eingeloggt:', userCredential.user);
      email.value = ''; // Felder leeren nach erfolgreichem Login
      password.value = '';
    } catch (error) {
      errorMessage.value = error.message; // Fehlermeldung anzeigen
      console.error('Fehler beim Login:', error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      errorMessage.value = '';
    } catch (error) {
      errorMessage.value = 'Fehler beim Ausloggen: ' + error.message;
    }
  };
  
  </script>
  
  <style scoped>
  .hstack {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  input {
    padding: 10px 14px;
    font-size: 1rem;
    border-radius: 10px;
    border: 1.5px solid #bbb;
    outline: none;
    transition: border 0.2s, box-shadow 0.2s;
    background: #f7f7f7;
    min-width: 160px;
    max-width: 220px;
    width: 100%;
    box-sizing: border-box;
  }
  input:focus {
    border: 1.5px solid #1976d2;
    box-shadow: 0 0 0 2px #e3f2fd;
    background: #fff;
  }
  input::placeholder {
    color: #888;
    font-size: 0.98em;
  }
  button {
    padding: 10px 18px;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 10px;
    background-color: lightblue;
    color: #222;
    border: none;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
  }
  button:hover {
    background-color: blanchedalmond;
    transform: scale(1.05);
  }
  .user-email {
    color: white;
    font-size: 1rem;
    margin-right: 12px;
  }
  .error {
    color: red;
    font-weight: bold;
    margin-top: 10px;
    font-size: 1em;
  }
  @media (max-width: 700px) {
    .hstack {
      flex-direction: column;
      gap: 8px;
      align-items: stretch;
    }
    input {
      min-width: 120px;
      max-width: 100%;
    }
    button {
      width: 100%;
    }
  }
  </style>
  