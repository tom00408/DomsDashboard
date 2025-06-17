<template>
	<div class="vstack">
		<HeaderBar :currentPage="currentPage" @changePage="currentPage = $event" />

        <div v-if="user" class="content-wrapper">
            <div v-if="currentPage === 'dashboard'" class="dashboard-grid">
                <Table status="selected"></Table>
                <Table status="new"></Table>
                <Table status="archived"></Table>
                <Table status="rest"></Table>
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
import Table from './components/Table.vue';
import Bestellungen from './components/Bestellungen.vue';
import Produkte from './components/Produkte.vue';
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
