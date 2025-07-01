<template>
	<div class="vstack">
		<HeaderBar :currentPage="currentPage" @changePage="currentPage = $event" />

        <div v-if="user" class="content-wrapper">
            <div v-if="currentPage === 'dashboard'" class="dashboard-grid">
                <AntragManager />
            </div>
            <div v-else-if="currentPage === 'bestellungen'" class="bestellungen-wrapper">
                <Bestellungen />
            </div>
            <div v-else-if="currentPage === 'produkte'" class="produkte-wrapper">
                <Produkte />
            </div>
        </div>
        <div v-else>
            <img src="./assets/coolerkeiler.PNG" alt="" class="bigkeiler">
        </div>
	</div>
</template>

<script setup>
import AntragManager from './pages/AntragManager.vue';
import Bestellungen from './pages/Bestellungen.vue';
import Produkte from './pages/Produkte.vue';
import HeaderBar from './components/HeaderBar.vue';
import { ref } from 'vue';
import { user } from './authState';

const currentPage = ref('dashboard');
</script>

<style scoped>


.bigkeiler{
    width: 100vw;
}

.hstack {
	align-items: flex-start;
}

</style>
