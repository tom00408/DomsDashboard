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
			path: '/widerrufe',
			name: 'Widerrufe',
			component: () => import('../views/WiderrufeView.vue'),
		},
		{
			path: '/produkte',
			name: 'Produkte',
			component: () => import('../views/ProdukteView.vue'),
		},
		{
			path: '/foev-antraege',
			name: 'FoevAntraege',
			component: () => import('../views/FoevAntraege.vue'),
		},
		{
			path: '/rundschauen',
			name: 'Rundschauen',
			component: () => import('../views/Rundschauen.vue'),
		},
		{
			path: '/shop-analytics',
			name: 'ShopAnalytics',
			component: () => import('../views/ShopAnalytics.vue'),
		},
		{
			path: '/einstellungen',
			name: 'Einstellungen',
			component: () => import('../views/EinstellungenView.vue'),
		},
	],
});

export default router;

