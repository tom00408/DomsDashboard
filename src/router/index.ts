import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			redirect: '/mitgliedsantraege',
		},
		{
			path: '/mitgliedsantraege',
			name: 'Mitgliedsantraege',
			component: () => import('../views/MitgliedsantraegeView.vue'),
		},
		{
			path: '/bestellungen',
			name: 'Bestellungen',
			component: () => import('../views/BestellungenView.vue'),
		},
		{
			path: '/produkte',
			name: 'Produkte',
			component: () => import('../views/ProdukteView.vue'),
		},
	],
});

export default router;

