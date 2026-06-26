<template>
	<section class="analytics-view">
		<header class="analytics-header">
				<h2>Shop Analytics</h2>
			<div class="time-filter">
				<button
					v-for="period in timePeriods"
					:key="period.value"
					:class="['period-btn', { active: selectedPeriod === period.value }]"
					@click="selectedPeriod = period.value">
					{{ period.label }}
				</button>
			</div>
		</header>

		<div v-if="loading" class="loading-state">
			<div class="spinner"></div>
			<p>Daten werden geladen...</p>
		</div>

		<div v-else-if="error" class="error-state">
			<p>{{ error }}</p>
			<button class="retry-btn" @click="loadData">Erneut versuchen</button>
		</div>

		<div v-else class="analytics-content">
			<!-- KPI Cards -->
			<div class="kpi-grid">
				<div class="kpi-card revenue">
					<div class="kpi-icon">💰</div>
					<div class="kpi-content">
						<h3>Gesamtumsatz</h3>
						<p class="kpi-value">{{ formatCurrency(totalRevenue) }}</p>
						<span class="kpi-change" :class="revenueChange >= 0 ? 'positive' : 'negative'">
							{{ revenueChange >= 0 ? '↑' : '↓' }} {{ Math.abs(revenueChange) }}%
						</span>
					</div>
				</div>

				<div class="kpi-card orders">
					<div class="kpi-icon">📦</div>
					<div class="kpi-content">
						<h3>Bestellungen</h3>
						<p class="kpi-value">{{ totalOrders }}</p>
						<span class="kpi-change" :class="ordersChange >= 0 ? 'positive' : 'negative'">
							{{ ordersChange >= 0 ? '↑' : '↓' }} {{ Math.abs(ordersChange) }}%
						</span>
					</div>
				</div>

				<div class="kpi-card average">
					<div class="kpi-icon">📊</div>
					<div class="kpi-content">
						<h3>Ø Bestellwert</h3>
						<p class="kpi-value">{{ formatCurrency(averageOrderValue) }}</p>
						<span class="kpi-change" :class="avgOrderChange >= 0 ? 'positive' : 'negative'">
							{{ avgOrderChange >= 0 ? '↑' : '↓' }} {{ Math.abs(avgOrderChange) }}%
						</span>
					</div>
				</div>

				<div class="kpi-card paid">
					<div class="kpi-icon">✅</div>
					<div class="kpi-content">
						<h3>Bezahlt</h3>
						<p class="kpi-value">{{ paidOrders }}</p>
						<span class="kpi-change">{{ paidPercentage }}%</span>
					</div>
				</div>
			</div>

			<!-- Charts Grid -->
			<div class="charts-grid">
				<!-- Revenue Trend Chart -->
				<div class="chart-card">
					<div class="chart-header">
						<h3>Umsatz-Trend</h3>
						<p>Entwicklung über Zeit</p>
					</div>
					<div class="chart-container">
						<canvas ref="revenueChart"></canvas>
					</div>
				</div>

				<!-- Orders Status Chart -->
				<div class="chart-card">
					<div class="chart-header">
						<h3>Bestellstatus</h3>
						<p>Verteilung nach Status</p>
					</div>
					<div class="chart-container">
						<canvas ref="statusChart"></canvas>
					</div>
				</div>

				<!-- Top Products Chart -->
				<div class="chart-card">
					<div class="chart-header">
						<h3>Top-Produkte</h3>
						<p>Meistverkaufte Artikel</p>
					</div>
					<div class="chart-container">
						<canvas ref="productsChart"></canvas>
					</div>
				</div>

				<!-- Monthly Revenue Chart -->
				<div class="chart-card">
					<div class="chart-header">
						<h3>Monatlicher Umsatz</h3>
						<p>Vergleich nach Monaten</p>
					</div>
					<div class="chart-container">
						<canvas ref="monthlyChart"></canvas>
					</div>
				</div>

				<!-- Orders Over Time -->
				<div class="chart-card">
					<div class="chart-header">
						<h3>Bestellungen über Zeit</h3>
						<p>Tägliche Entwicklung</p>
					</div>
					<div class="chart-container">
						<canvas ref="ordersChart"></canvas>
					</div>
				</div>

				<!-- Payment Status -->
				<div class="chart-card">
					<div class="chart-header">
						<h3>Zahlungsstatus</h3>
						<p>Bezahlt vs. Offen</p>
					</div>
					<div class="chart-container">
						<canvas ref="paymentChart"></canvas>
					</div>
				</div>
			</div>

			<!-- Detailed Stats -->
			<div class="stats-grid">
				<div class="stat-card">
					<h4>Bestellungen nach Status</h4>
					<div class="stat-list">
						<div v-for="status in statusBreakdown" :key="status.name" class="stat-item">
							<span class="stat-label">{{ status.label }}</span>
							<div class="stat-bar">
								<div
									class="stat-bar-fill"
									:style="{ width: `${(status.count / totalOrders) * 100}%`, backgroundColor: status.color }"></div>
							</div>
							<span class="stat-value">{{ status.count }}</span>
						</div>
					</div>
				</div>

				<div class="stat-card">
					<h4>Top-Teams</h4>
					<div class="stat-list">
						<div v-for="(team, index) in topTeams" :key="team.name" class="stat-item">
							<span class="stat-label">{{ team.name || 'Unbekannt' }}</span>
							<div class="stat-bar">
								<div
									class="stat-bar-fill"
									:style="{ width: `${(team.count / totalOrders) * 100}%` }"></div>
							</div>
							<span class="stat-value">{{ team.count }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../service/firebase';
import { getOrderStatusLabel } from '../service/settingsService';
import {
	Chart,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler,
	LineController,
	BarController,
	DoughnutController,
	PieController,
} from 'chart.js';
import CryptoJS from 'crypto-js';

Chart.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler,
	LineController,
	BarController,
	DoughnutController,
	PieController
);

interface Bestellung {
	id: string;
	total: number;
	status: string;
	bezahlt: boolean;
	createdAt: Timestamp;
	items: Array<{
		name: string;
		quantity: number;
		price: number;
	}>;
	team?: string;
}

const loading = ref(true);
const error = ref<string | null>(null);
const bestellungen = ref<Bestellung[]>([]);
const selectedPeriod = ref('all');
const encryptionKey = import.meta.env.VITE_BESTELLUNGEN_KEY;

const timePeriods = [
	{ label: 'Alle', value: 'all' },
	{ label: 'Heute', value: 'today' },
	{ label: '7 Tage', value: 'week' },
	{ label: '30 Tage', value: 'month' },
	{ label: 'Jahr', value: 'year' },
];

const revenueChart = ref<HTMLCanvasElement | null>(null);
const statusChart = ref<HTMLCanvasElement | null>(null);
const productsChart = ref<HTMLCanvasElement | null>(null);
const monthlyChart = ref<HTMLCanvasElement | null>(null);
const ordersChart = ref<HTMLCanvasElement | null>(null);
const paymentChart = ref<HTMLCanvasElement | null>(null);

let chartInstances: Chart[] = [];

const decryptData = (encryptedData: string): string => {
	try {
		const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
		return bytes.toString(CryptoJS.enc.Utf8);
	} catch (error) {
		console.error('Fehler beim Entschlüsseln:', error);
		return encryptedData;
	}
};

const getPeriodFilter = (): Date => {
	const now = new Date();
	const filters: Record<string, Date> = {
		today: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
		week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
		month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
		year: new Date(now.getFullYear(), 0, 1),
	};
	return filters[selectedPeriod.value] || new Date(0);
};

const filteredBestellungen = computed(() => {
	if (selectedPeriod.value === 'all') return bestellungen.value;
	const filterDate = getPeriodFilter();
	return bestellungen.value.filter((b) => {
		const orderDate = b.createdAt.toDate();
		return orderDate >= filterDate;
	});
});

const totalRevenue = computed(() => {
	return filteredBestellungen.value.reduce((sum, b) => sum + (b.total || 0), 0);
});

const totalOrders = computed(() => filteredBestellungen.value.length);

const averageOrderValue = computed(() => {
	return totalOrders.value > 0 ? totalRevenue.value / totalOrders.value : 0;
});

const paidOrders = computed(() => {
	return filteredBestellungen.value.filter((b) => b.bezahlt).length;
});

const paidPercentage = computed(() => {
	return totalOrders.value > 0 ? Math.round((paidOrders.value / totalOrders.value) * 100) : 0;
});

const revenueChange = computed(() => {
	if (selectedPeriod.value === 'all') return 0;
	const current = totalRevenue.value;
	const previous = getPreviousPeriodRevenue();
	if (previous === 0) return 0;
	return Math.round(((current - previous) / previous) * 100);
});

const ordersChange = computed(() => {
	if (selectedPeriod.value === 'all') return 0;
	const current = totalOrders.value;
	const previous = getPreviousPeriodOrders();
	if (previous === 0) return 0;
	return Math.round(((current - previous) / previous) * 100);
});

const avgOrderChange = computed(() => {
	if (selectedPeriod.value === 'all') return 0;
	const current = averageOrderValue.value;
	const previous = getPreviousPeriodAvg();
	if (previous === 0) return 0;
	return Math.round(((current - previous) / previous) * 100);
});

const getPreviousPeriodRevenue = () => {
	const filterDate = getPeriodFilter();
	const periodLength = new Date().getTime() - filterDate.getTime();
	const previousStart = new Date(filterDate.getTime() - periodLength);
	return bestellungen.value
		.filter((b) => {
			const orderDate = b.createdAt.toDate();
			return orderDate >= previousStart && orderDate < filterDate;
		})
		.reduce((sum, b) => sum + (b.total || 0), 0);
};

const getPreviousPeriodOrders = () => {
	const filterDate = getPeriodFilter();
	const periodLength = new Date().getTime() - filterDate.getTime();
	const previousStart = new Date(filterDate.getTime() - periodLength);
	return bestellungen.value.filter((b) => {
		const orderDate = b.createdAt.toDate();
		return orderDate >= previousStart && orderDate < filterDate;
	}).length;
};

const getPreviousPeriodAvg = () => {
	const filterDate = getPeriodFilter();
	const periodLength = new Date().getTime() - filterDate.getTime();
	const previousStart = new Date(filterDate.getTime() - periodLength);
	const previousOrders = bestellungen.value.filter((b) => {
		const orderDate = b.createdAt.toDate();
		return orderDate >= previousStart && orderDate < filterDate;
	});
	const previousRevenue = previousOrders.reduce((sum, b) => sum + (b.total || 0), 0);
	return previousOrders.length > 0 ? previousRevenue / previousOrders.length : 0;
};

const statusBreakdown = computed(() => {
	const statuses: Record<string, number> = {};
	filteredBestellungen.value.forEach((b) => {
		statuses[b.status] = (statuses[b.status] || 0) + 1;
	});

	// Labels inkl. Custom-Status über settingsService
	const statusLabels: Record<string, string> = {};
	filteredBestellungen.value.forEach((b) => {
		if (b.status && !statusLabels[b.status]) {
			statusLabels[b.status] = getOrderStatusLabel(b.status);
		}
	});

	const colors: Record<string, string> = {
		neu: '#b40024',
		in_bearbeitung: '#ff9800',
		abgeschlossen: '#4caf50',
	};

	return Object.entries(statuses).map(([name, count]) => ({
		name,
		label: statusLabels[name] || name,
		count,
		color: colors[name] || '#666',
	}));
});

const topTeams = computed(() => {
	const teams: Record<string, number> = {};
	filteredBestellungen.value.forEach((b) => {
		const team = b.team || 'Unbekannt';
		teams[team] = (teams[team] || 0) + 1;
	});

	return Object.entries(teams)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);
});

const topProducts = computed(() => {
	const products: Record<string, { quantity: number; revenue: number }> = {};
	filteredBestellungen.value.forEach((b) => {
		b.items?.forEach((item) => {
			const productName = item.name || 'Unbekannt';
			if (!products[productName]) {
				products[productName] = { quantity: 0, revenue: 0 };
			}
			const quantity = item.quantity || 0;
			const price = item.price || 0;
			const product = products[productName];
			if (product) {
				product.quantity += quantity;
				product.revenue += price * quantity;
			}
		});
	});

	return Object.entries(products)
		.map(([name, data]) => ({ name, ...data }))
		.sort((a, b) => b.quantity - a.quantity)
		.slice(0, 10);
});

const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2,
	}).format(amount);
};

const loadData = async () => {
	loading.value = true;
	error.value = null;

	try {
		const querySnapshot = await getDocs(query(collection(db, 'bestellungen'), orderBy('createdAt', 'desc')));
		bestellungen.value = querySnapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				...data,
				team: data.team ? decryptData(data.team) : '',
			} as Bestellung;
		});
	} catch (err) {
		console.error('Fehler beim Laden der Bestellungen:', err);
		error.value = 'Daten konnten nicht geladen werden.';
	} finally {
		loading.value = false;
	}
};

const destroyCharts = () => {
	chartInstances.forEach((chart) => {
		try {
			chart.destroy();
		} catch (err) {
			console.warn('Fehler beim Zerstören des Charts:', err);
		}
	});
	chartInstances = [];
};

const createCharts = () => {
	destroyCharts();

	if (!revenueChart.value || !statusChart.value || !productsChart.value || !monthlyChart.value || !ordersChart.value || !paymentChart.value) {
		return;
	}

	const chartColors = {
		primary: '#b40024',
		secondary: '#ff9800',
		success: '#4caf50',
		info: '#2196f3',
		background: 'rgba(180, 0, 36, 0.1)',
	};

	// Revenue Trend Chart
	const revenueData = getRevenueTrendData();
	const revenueCtx = revenueChart.value.getContext('2d');
	if (revenueCtx) {
		const chart = new Chart(revenueCtx, {
			type: 'line',
			data: {
				labels: revenueData.labels,
				datasets: [
					{
						label: 'Umsatz',
						data: revenueData.values,
						borderColor: chartColors.primary,
						backgroundColor: chartColors.background,
						fill: true,
						tension: 0.4,
						pointRadius: 4,
						pointHoverRadius: 6,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					tooltip: {
						callbacks: {
							label: (context) => formatCurrency((context.parsed.y as number) || 0),
						},
					},
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: (value) => formatCurrency(value as number),
						},
					},
				},
			},
		});
		chartInstances.push(chart);
	}

	// Status Chart
	const statusData = statusBreakdown.value;
	const statusCtx = statusChart.value.getContext('2d');
	if (statusCtx) {
		const chart = new Chart(statusCtx, {
			type: 'doughnut',
			data: {
				labels: statusData.map((s) => s.label),
				datasets: [
					{
						data: statusData.map((s) => s.count),
						backgroundColor: statusData.map((s) => s.color),
						borderWidth: 0,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
					},
				},
			},
		});
		chartInstances.push(chart);
	}

	// Products Chart
	const productsData = topProducts.value;
	const productsCtx = productsChart.value.getContext('2d');
	if (productsCtx) {
		const chart = new Chart(productsCtx, {
			type: 'bar',
			data: {
				labels: productsData.map((p) => p.name.substring(0, 20)),
				datasets: [
					{
						label: 'Verkaufte Menge',
						data: productsData.map((p) => p.quantity),
						backgroundColor: chartColors.primary,
						borderRadius: 4,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
				},
				scales: {
					y: {
						beginAtZero: true,
					},
				},
			},
		});
		chartInstances.push(chart);
	}

	// Monthly Chart
	const monthlyData = getMonthlyRevenueData();
	if (monthlyChart.value) {
		const monthlyCtx = monthlyChart.value.getContext('2d');
		if (monthlyCtx) {
			const chart = new Chart(monthlyCtx, {
				type: 'bar',
				data: {
					labels: monthlyData.labels,
					datasets: [
						{
							label: 'Umsatz',
							data: monthlyData.values,
							backgroundColor: chartColors.info,
							borderRadius: 4,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { display: false },
						tooltip: {
							callbacks: {
								label: (context) => formatCurrency((context.parsed.y as number) || 0),
							},
						},
					},
					scales: {
						y: {
							beginAtZero: true,
							ticks: {
								callback: (value) => formatCurrency(value as number),
							},
						},
					},
				},
			});
			chartInstances.push(chart);
		}
	}

	// Orders Chart
	const ordersData = getOrdersOverTimeData();
	if (ordersChart.value) {
		const ordersCtx = ordersChart.value.getContext('2d');
		if (ordersCtx) {
			const chart = new Chart(ordersCtx, {
				type: 'line',
				data: {
					labels: ordersData.labels,
					datasets: [
						{
							label: 'Bestellungen',
							data: ordersData.values,
							borderColor: chartColors.secondary,
							backgroundColor: 'rgba(255, 152, 0, 0.1)',
							fill: true,
							tension: 0.4,
							pointRadius: 3,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { display: false },
					},
					scales: {
						y: {
							beginAtZero: true,
						},
					},
				},
			});
			chartInstances.push(chart);
		}
	}

	// Payment Chart
	if (paymentChart.value) {
		const paymentCtx = paymentChart.value.getContext('2d');
		if (paymentCtx) {
			const chart = new Chart(paymentCtx, {
				type: 'pie',
				data: {
					labels: ['Bezahlt', 'Offen'],
					datasets: [
						{
							data: [paidOrders.value, totalOrders.value - paidOrders.value],
							backgroundColor: [chartColors.success, '#f44336'],
							borderWidth: 0,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							position: 'bottom',
						},
					},
				},
			});
			chartInstances.push(chart);
		}
	}
};

const getRevenueTrendData = () => {
	const days = selectedPeriod.value === 'all' ? 30 : selectedPeriod.value === 'year' ? 12 : 7;
	const data: Record<string, number> = {};
	const labels: string[] = [];

	const now = new Date();
	for (let i = days - 1; i >= 0; i--) {
		const date = new Date(now);
		if (selectedPeriod.value === 'year') {
			date.setMonth(date.getMonth() - i);
			const label = date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
			labels.push(label);
			data[label] = 0;
		} else {
			date.setDate(date.getDate() - i);
			const label = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
			labels.push(label);
			data[label] = 0;
		}
	}

	filteredBestellungen.value.forEach((b) => {
		const orderDate = b.createdAt.toDate();
		let label: string;
		if (selectedPeriod.value === 'year') {
			label = orderDate.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
		} else {
			label = orderDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
		}
		const currentValue = data[label];
		if (currentValue !== undefined) {
			data[label] = currentValue + (b.total || 0);
		}
	});

	return {
		labels,
		values: labels.map((label) => data[label] || 0),
	};
};

const getMonthlyRevenueData = () => {
	const months = [
		'Jan',
		'Feb',
		'Mär',
		'Apr',
		'Mai',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Okt',
		'Nov',
		'Dez',
	];
	const data: Record<number, number> = {};

	filteredBestellungen.value.forEach((b) => {
		const month = b.createdAt.toDate().getMonth();
		data[month] = (data[month] || 0) + (b.total || 0);
	});

	return {
		labels: months,
		values: months.map((_, index) => data[index] || 0),
	};
};

const getOrdersOverTimeData = () => {
	const days = selectedPeriod.value === 'all' ? 30 : selectedPeriod.value === 'year' ? 12 : 7;
	const data: Record<string, number> = {};
	const labels: string[] = [];

	const now = new Date();
	for (let i = days - 1; i >= 0; i--) {
		const date = new Date(now);
		if (selectedPeriod.value === 'year') {
			date.setMonth(date.getMonth() - i);
			const label = date.toLocaleDateString('de-DE', { month: 'short' });
			labels.push(label);
			data[label] = 0;
		} else {
			date.setDate(date.getDate() - i);
			const label = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
			labels.push(label);
			data[label] = 0;
		}
	}

	filteredBestellungen.value.forEach((b) => {
		const orderDate = b.createdAt.toDate();
		let label: string;
		if (selectedPeriod.value === 'year') {
			label = orderDate.toLocaleDateString('de-DE', { month: 'short' });
		} else {
			label = orderDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
		}
		if (data[label] !== undefined) {
			data[label] = (data[label] || 0) + 1;
		}
	});

	return {
		labels,
		values: labels.map((label) => data[label] || 0),
	};
};

let chartCreationTimeout: ReturnType<typeof setTimeout> | null = null;

watch([selectedPeriod, filteredBestellungen], () => {
	if (!loading.value && !error.value) {
		if (chartCreationTimeout) {
			clearTimeout(chartCreationTimeout);
		}
		chartCreationTimeout = setTimeout(() => {
			createCharts();
			chartCreationTimeout = null;
		}, 200);
	}
});

onMounted(async () => {
	await loadData();
	if (!error.value) {
		setTimeout(() => {
			createCharts();
		}, 300);
	}
});

onBeforeUnmount(() => {
	if (chartCreationTimeout) {
		clearTimeout(chartCreationTimeout);
	}
	destroyCharts();
});
</script>

<style scoped>
.analytics-view {
	padding: 32px;
	background: var(--color-surface-elevated, #fff);
	border-radius: var(--border-radius-md, 18px);
	border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
	color: var(--color-text-primary, #1c1f2b);
}

.analytics-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 32px;
	flex-wrap: wrap;
	gap: 20px;
}

.analytics-header h2 {
	margin: 0 0 8px;
	font-size: 2rem;
	font-weight: var(--font-weight-semibold, 600);
}

.analytics-header p {
	margin: 0;
	color: var(--color-text-secondary, rgba(28, 31, 43, 0.64));
}

.time-filter {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.period-btn {
	padding: 8px 16px;
	border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
	border-radius: var(--border-radius-sm, 8px);
	background: var(--color-surface, #fff);
	color: var(--color-text-primary, #1c1f2b);
	font-size: 0.9rem;
	cursor: pointer;
	transition: all 160ms ease;
}

.period-btn:hover {
	background: var(--color-glass, rgba(255, 255, 255, 0.7));
	border-color: var(--color-logo-red, #b40024);
}

.period-btn.active {
	background: var(--color-logo-red, #b40024);
	color: var(--color-contrast-light, #fff);
	border-color: var(--color-logo-red, #b40024);
}

.loading-state,
.error-state {
	text-align: center;
	padding: 60px 20px;
}

.spinner {
	width: 40px;
	height: 40px;
	border: 4px solid var(--color-border, rgba(0, 0, 0, 0.1));
	border-top-color: var(--color-logo-red, #b40024);
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
	margin: 0 auto 16px;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.retry-btn {
	padding: 10px 20px;
	margin-top: 16px;
	background: var(--color-logo-red, #b40024);
	color: var(--color-contrast-light, #fff);
	border: none;
	border-radius: var(--border-radius-sm, 8px);
	cursor: pointer;
}

.kpi-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 20px;
	margin-bottom: 32px;
}

.kpi-card {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 24px;
	border-radius: var(--border-radius-md, 16px);
	background: linear-gradient(135deg, rgba(180, 0, 36, 0.05) 0%, rgba(180, 0, 36, 0.02) 100%);
	border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
	transition: transform 200ms ease, box-shadow 200ms ease;
}

.kpi-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.kpi-card.revenue {
	border-left: 4px solid #b40024;
}

.kpi-card.orders {
	border-left: 4px solid #2196f3;
}

.kpi-card.average {
	border-left: 4px solid #4caf50;
}

.kpi-card.paid {
	border-left: 4px solid #ff9800;
}

.kpi-icon {
	font-size: 2.5rem;
	line-height: 1;
}

.kpi-content {
	flex: 1;
}

.kpi-content h3 {
	margin: 0 0 8px;
	font-size: 0.9rem;
	font-weight: var(--font-weight-medium, 500);
	color: var(--color-text-secondary, rgba(28, 31, 43, 0.64));
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.kpi-value {
	margin: 0 0 4px;
	font-size: 1.8rem;
	font-weight: var(--font-weight-bold, 700);
	color: var(--color-text-primary, #1c1f2b);
}

.kpi-change {
	font-size: 0.85rem;
	font-weight: var(--font-weight-medium, 500);
}

.kpi-change.positive {
	color: #4caf50;
}

.kpi-change.negative {
	color: #f44336;
}

.charts-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
	gap: 24px;
	margin-bottom: 32px;
}

.chart-card {
	background: var(--color-surface, #fff);
	border-radius: var(--border-radius-md, 16px);
	border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
	padding: 24px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.chart-header {
	margin-bottom: 20px;
}

.chart-header h3 {
	margin: 0 0 4px;
	font-size: 1.2rem;
	font-weight: var(--font-weight-semibold, 600);
}

.chart-header p {
	margin: 0;
	font-size: 0.85rem;
	color: var(--color-text-secondary, rgba(28, 31, 43, 0.64));
}

.chart-container {
	position: relative;
	height: 300px;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 24px;
}

.stat-card {
	background: var(--color-surface, #fff);
	border-radius: var(--border-radius-md, 16px);
	border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
	padding: 24px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-card h4 {
	margin: 0 0 20px;
	font-size: 1.1rem;
	font-weight: var(--font-weight-semibold, 600);
}

.stat-list {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.stat-item {
	display: flex;
	align-items: center;
	gap: 12px;
}

.stat-label {
	flex: 0 0 120px;
	font-size: 0.9rem;
	color: var(--color-text-primary, #1c1f2b);
}

.stat-bar {
	flex: 1;
	height: 8px;
	background: var(--color-border, rgba(0, 0, 0, 0.1));
	border-radius: 4px;
	overflow: hidden;
}

.stat-bar-fill {
	height: 100%;
	background: var(--color-logo-red, #b40024);
	border-radius: 4px;
	transition: width 400ms ease;
}

.stat-value {
	flex: 0 0 40px;
	text-align: right;
	font-weight: var(--font-weight-semibold, 600);
	font-size: 0.9rem;
}

@media (max-width: 768px) {
	.analytics-view {
		padding: 20px;
	}

	.charts-grid {
		grid-template-columns: 1fr;
	}

	.kpi-grid {
		grid-template-columns: 1fr;
	}
}
</style>
