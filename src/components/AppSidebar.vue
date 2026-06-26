<template>
	<aside class="sidebar">
		<header class="sidebar-header">
			<div class="logo-badge">
				<img :src="logoUrl" alt="MTV Geismar Logo" />
			</div>
			<div class="sidebar-title">
				<h1>MTV Geismar</h1>
				<p>Vereinsdashboard</p>
			</div>
		</header>
		<nav class="nav">
			<RouterLink to="/mitgliedsantraege" class="nav-link">
				<span class="nav-link-label">Mitgliedsanträge</span>
				<span class="nav-link-accent" aria-hidden="true" />
			</RouterLink>
            <RouterLink to="/foev-antraege" class="nav-link">
                <span class="nav-link-label">FÖV Mitgliedsanträge</span>
                <span class="nav-link-accent" aria-hidden="true" />
            </RouterLink>
			<RouterLink to="/bestellungen" class="nav-link">
				<span class="nav-link-label">Bestellungen</span>
				<span class="nav-link-accent" aria-hidden="true" />
			</RouterLink>
			<RouterLink to="/produkte" class="nav-link">
				<span class="nav-link-label">Produkte</span>
				<span class="nav-link-accent" aria-hidden="true" />
			</RouterLink>
			<RouterLink to="/shop-analytics" class="nav-link">
				<span class="nav-link-label">Shop Analytics</span>
				<span class="nav-link-accent" aria-hidden="true" />
			</RouterLink>
			<RouterLink to="/rundschauen" class="nav-link">
				<span class="nav-link-label">Rundschauen</span>
				<span class="nav-link-accent" aria-hidden="true" />
			</RouterLink>
			<RouterLink to="/einstellungen" class="nav-link">
				<span class="nav-link-label">Einstellungen</span>
				<span class="nav-link-accent" aria-hidden="true" />
			</RouterLink>
		</nav>
		<footer class="sidebar-footer" v-if="currentUser">
			<div class="sidebar-user">
				<p class="sidebar-user-label">Angemeldet als</p>
				<p v-if="userEmail" class="sidebar-user-email">{{ userEmail }}</p>
			</div>
			<button class="logout-btn" type="button" @click="emitLogout" :disabled="isLoggingOut">
				<span v-if="!isLoggingOut">Abmelden</span>
				<span v-else class="logout-loading">
					<span class="dot" />
					<span class="dot" />
					<span class="dot" />
				</span>
			</button>
			{{ appVersion }}
		</footer>
	</aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { User } from 'firebase/auth';
import logoUrl from '../assets/coolerkeiler.png';

const props = defineProps<{
	currentUser: User | null;
	isLoggingOut?: boolean;
}>();

const emit = defineEmits<{
	(e: 'logout'): void;
}>();

const displayName = computed(
	() =>
		props.currentUser?.displayName ||
		props.currentUser?.email ||
		props.currentUser?.phoneNumber ||
		'Unbekannter Benutzer'
);

const userEmail = computed(() => props.currentUser?.email ?? '');
const isLoggingOut = computed(() => props.isLoggingOut === true);
const appVersion = import.meta.env.VITE_APP_VERSION;

const emitLogout = () => {
	if (!isLoggingOut.value) {
		emit('logout');
	}
};
</script>

<style scoped>
.sidebar {
	display: flex;
	flex-direction: column;
	gap: 32px;
	padding: 32px 28px 24px;
	background: var(--color-sidebar-background);
	color: var(--color-sidebar-text);
	border-radius: 0;
	box-shadow: none;
	position: sticky;
	top: 0;
	height: 100dvh;
	max-height: 100dvh;
	overflow: hidden;
}

.sidebar::after {
	content: '';
	position: absolute;
	inset: 18px;
	border-radius: calc(var(--border-radius-lg) - 18px);
	background: color-mix(
		in srgb,
		var(--color-highlight) 12%,
		var(--color-transparent)
	);
	opacity: 0.55;
	filter: blur(60px);
	pointer-events: none;
}

.sidebar > * {
	position: relative;
	z-index: 1;
}

.sidebar-header {
	display: flex;
	align-items: center;
	gap: 18px;
	margin: 0;
}

.sidebar-header h1 {
	margin: 0;
	font-size: 1.4rem;
	font-weight: var(--font-weight-semibold);
	letter-spacing: 0.02em;
}

.sidebar-header p {
	margin: 6px 0 0;
	font-size: 0.95rem;
	font-weight: var(--font-weight-regular);
	color: var(--color-sidebar-text-muted);
	letter-spacing: 0.06em;
	text-transform: uppercase;
}

.logo-badge {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 82px;
	padding: 10px;
	background: color-mix(
		in srgb,
		var(--color-highlight) 35%,
		var(--color-contrast-dark) 65%
	);
	border-radius: 26px;
	box-shadow: 0 16px 32px -20px
		color-mix(in srgb, var(--color-contrast-dark) 75%, var(--color-transparent));
}

.logo-badge img {
	width: 100%;
	height: auto;
	max-height: 94px;
	object-fit: contain;
	filter: drop-shadow(
		0 10px 20px color-mix(in srgb, var(--color-contrast-dark) 40%, var(--color-transparent))
	);
}

.nav {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.nav-link {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18px;
	padding: 14px 16px;
	border-radius: var(--border-radius-sm);
	color: var(--color-sidebar-text);
	text-decoration: none;
	font-weight: var(--font-weight-medium);
	letter-spacing: 0.01em;
	position: relative;
	background: color-mix(
		in srgb,
		var(--color-transparent) 78%,
		var(--color-accent-gray) 22%
	);
	backdrop-filter: blur(6px);
	transition: background var(--transition-default),
		transform var(--transition-default), color var(--transition-default),
		box-shadow var(--transition-default);
}

.nav-link:hover,
.nav-link:focus-visible {
	transform: translateX(-6px);
	background: color-mix(
		in srgb,
		var(--color-highlight) 50%,
		var(--color-transparent) 50%
	);
	color: var(--color-sidebar-text);
	box-shadow: var(--shadow-soft);
	outline: none;
}

.nav-link:focus-visible {
	border: 1px solid color-mix(
			in srgb,
			var(--color-highlight) 55%,
			var(--color-contrast-light) 45%
		);
}

.router-link-active,
.router-link-exact-active {
	background: color-mix(
		in srgb,
		var(--color-highlight) 65%,
		var(--color-contrast-dark) 35%
	);
	color: var(--color-sidebar-text);
	box-shadow: var(--shadow-soft);
}

.nav-link-accent {
	display: block;
	width: 8px;
	height: 8px;
	border-radius: 999px;
	background: color-mix(
		in srgb,
		var(--color-highlight) 80%,
		var(--color-contrast-light) 20%
	);
	opacity: 0;
	transform: scale(0.4);
	transition: opacity var(--transition-default),
		transform var(--transition-default);
}

.router-link-active .nav-link-accent,
.router-link-exact-active .nav-link-accent,
.nav-link:hover .nav-link-accent {
	opacity: 1;
	transform: scale(1);
}

.sidebar-footer {
	margin-top: auto;
	padding-top: 24px;
	border-top: 1px solid color-mix(
			in srgb,
			var(--color-sidebar-text-muted) 35%,
			var(--color-transparent) 65%
		);
	display: flex;
	flex-direction: column;
	gap: 12px;
	font-size: 0.85rem;
	color: var(--color-sidebar-text-muted);
}

.sidebar-user {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.sidebar-user-label {
	margin: 0;
	text-transform: uppercase;
	letter-spacing: 0.12em;
	font-size: 0.7rem;
	color: var(--color-sidebar-text-muted);
}

.sidebar-user-name {
	margin: 0;
	font-size: 1rem;
	font-weight: var(--font-weight-semibold);
	color: var(--color-sidebar-text);
}

.sidebar-user-email {
	margin: 0;
	font-size: 0.85rem;
	color: color-mix(
		in srgb,
		var(--color-sidebar-text) 80%,
		var(--color-sidebar-text-muted) 20%
	);
}

.logout-btn {
	align-self: flex-start;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 10px 16px;
	border-radius: var(--border-radius-sm);
	border: 1px solid color-mix(
		in srgb,
		var(--color-sidebar-text) 35%,
		var(--color-transparent) 65%
	);
	background: color-mix(
		in srgb,
		var(--color-highlight) 45%,
		var(--color-transparent) 55%
	);
	color: var(--color-sidebar-text);
	font-weight: var(--font-weight-medium);
	cursor: pointer;
	transition: transform var(--transition-default),
		box-shadow var(--transition-default),
		background var(--transition-default);
}

.logout-btn:hover:not(:disabled),
.logout-btn:focus-visible:not(:disabled) {
	transform: translateY(-2px);
	box-shadow: var(--shadow-soft);
	outline: none;
}

.logout-btn:disabled {
	cursor: wait;
	opacity: 0.7;
}

.logout-loading {
	display: inline-flex;
	align-items: center;
	gap: 4px;
}

.logout-loading .dot {
	width: 5px;
	height: 5px;
	border-radius: 999px;
	background: var(--color-sidebar-text);
	animation: pulse 0.9s infinite ease-in-out;
}

.logout-loading .dot:nth-child(2) {
	animation-delay: 0.12s;
}

.logout-loading .dot:nth-child(3) {
	animation-delay: 0.24s;
}

@keyframes pulse {
	0%,
	80%,
	100% {
		opacity: 0.4;
		transform: translateY(0);
	}
	40% {
		opacity: 1;
		transform: translateY(-4px);
	}
}

@media (max-width: 1180px) {
	.sidebar {
		position: static;
		height: auto;
		max-height: none;
		flex-direction: row;
		align-items: center;
		padding: 24px;
	}

	.sidebar::after {
		display: none;
	}

	.sidebar-header {
		flex: 1 1 auto;
	}

	.nav {
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.nav-link {
		padding: 12px 14px;
	}

	.sidebar-footer {
		margin-top: 0;
		padding-top: 0;
		border-top: none;
		margin-left: auto;
		align-items: flex-end;
		text-align: right;
	}

	.logout-btn {
		align-self: flex-end;
	}
}

@media (max-width: 768px) {
	.sidebar {
		flex-direction: column;
		align-items: stretch;
		gap: 24px;
	}

	.nav {
		flex-direction: column;
		align-items: stretch;
	}

	.sidebar-footer {
		align-items: stretch;
		text-align: left;
		margin-left: 0;
	}

	.logout-btn {
		width: 100%;
		justify-content: center;
	}
}
</style>

