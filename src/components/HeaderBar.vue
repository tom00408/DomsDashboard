<template>
  <header class="header-bar">
    <div class="header-left">
      <img src="../assets/coolerkeiler.PNG" alt="MTV Logo" class="keiler" />
      <span class="title">Dom's Dashboard</span>
    </div>
    <nav class="navigation">
      <button
        v-for="item in navItems"
        :key="item.key"
        :class="{ active: currentPage === item.key }"
        @click="$emit('changePage', item.key)"
      >
        {{ item.label }}
      </button>
    </nav>
    <div class="login">
      <Login />
    </div>
  </header>
</template>

<script setup>
import Login from './Login.vue';
import { defineProps } from 'vue';
const props = defineProps({
  currentPage: String
});
const navItems = [
  { key: 'dashboard', label: 'Mitgliedsanträge' },
  { key: 'bestellungen', label: 'Bestellungen' },
  { key: 'produkte', label: 'Produkte' },
  { key: 'rundschau', label: 'Rundschau' },
];
</script>

<style scoped>
.header-bar {
  width: 100vw;
  background: black;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 2vw;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-sizing: border-box;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.keiler {
  width: 48px;
  height: 48px;
  object-fit: contain;
}
.title {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  letter-spacing: 1px;
}
.navigation {
  display: flex;
  gap: 1rem;
}
.navigation button {
  background: none;
  border: none;
  color: white;
  font-size: 1.1rem;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.navigation button.active {
  background: #e3f2fd;
  color: #222;
}
.navigation button:hover {
  background: #f5f5f5;
  color: #111;
}
.login {
  margin-left: 1rem;
}
@media (max-width: 700px) {
  .header-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    padding: 0.5rem 2vw;
  }
  .header-left {
    justify-content: center;
  }
  .navigation {
    justify-content: center;
    gap: 0.5rem;
  }
  .login {
    margin-left: 0;
    display: flex;
    justify-content: center;
  }
}
</style> 