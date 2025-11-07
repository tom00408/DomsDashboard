<template>
	<div v-if="!authReady" class="auth-loading">
		<div class="auth-loading-card">
			<span class="spinner" aria-hidden="true" />
			<p>Anmeldung wird geprüft …</p>
		</div>
	</div>
	<template v-else>
		<div v-if="currentUser" class="shell">
			<AppSidebar
				:current-user="currentUser"
				:is-logging-out="isLoggingOut"
				@logout="handleLogout"
			/>
			<main class="content">
				<RouterView v-slot="{ Component }">
					<Transition name="route-fade" mode="out-in">
						<component :is="Component" class="route-view" />
					</Transition>
				</RouterView>
			</main>
		</div>
		<LoginView v-else />
	</template>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { signOut } from 'firebase/auth';
import AppSidebar from './components/AppSidebar.vue';
import LoginView from './views/LoginView.vue';
import { user, isAuthReady } from './service/authState';
import { auth } from './service/firebase';

const currentUser = computed(() => user.value);
const authReady = computed(() => isAuthReady.value);
const isLoggingOut = ref(false);

const handleLogout = async () => {
	if (isLoggingOut.value) return;
	isLoggingOut.value = true;
	try {
		await signOut(auth);
	} catch (error) {
		console.error('Logout fehlgeschlagen', error);
	} finally {
		isLoggingOut.value = false;
	}
};
</script>

<style scoped>
.shell {
	flex: 1 1 auto;
	display: grid;
	grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
	gap: 24px;
	max-width: 1380px;
	width: 100%;
	margin: 0 auto;
	height: calc(100dvh - 48px);
	max-height: calc(100dvh - 48px);
	min-height: calc(100dvh - 48px);
	overflow: hidden;
	align-items: stretch;
}

.content {
	display: flex;
	flex-direction: column;
	padding: 28px 30px;
	background: var(--color-surface);
	border-radius: var(--border-radius-lg);
	box-shadow: var(--shadow-soft);
	backdrop-filter: blur(8px);
	border: 1px solid var(--color-border);
	position: relative;
	overflow: hidden;
	overflow-y: auto;
	scrollbar-gutter: stable both-edges;
}

.content::before {
	content: '';
	position: absolute;
	inset: 0;
	background: radial-gradient(
		120% 120% at 20% 10%,
		color-mix(in srgb, var(--color-highlight) 18%, var(--color-transparent)) 0%,
		var(--color-transparent) 70%
	);
	pointer-events: none;
}

.route-view {
	display: block;
	width: 100%;
	height: 100%;
	animation: float-in var(--transition-slow);
}

@keyframes float-in {
	0% {
		opacity: 0;
		transform: translate3d(0, 16px, 0) scale(0.98);
	}
	100% {
		opacity: 1;
		transform: translate3d(0, 0, 0) scale(1);
	}
}

.auth-loading {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	background: var(--color-background-gradient);
}

.auth-loading-card {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 18px 22px;
	border-radius: var(--border-radius-sm);
	background: color-mix(
		in srgb,
		var(--color-surface) 78%,
		var(--color-glass) 22%
	);
	border: 1px solid var(--color-border);
	box-shadow: var(--shadow-soft);
	color: var(--color-text-primary);
}

.auth-loading-card p {
	margin: 0;
	font-weight: var(--font-weight-medium);
}

.spinner {
	width: 18px;
	height: 18px;
	border-radius: 50%;
	border: 3px solid color-mix(
			in srgb,
			var(--color-contrast-light) 75%,
			var(--color-accent-gray) 25%
		);
	border-top-color: color-mix(
		in srgb,
		var(--color-logo-red) 70%,
		var(--color-contrast-dark) 30%
	);
	animation: spin 0.9s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

@media (max-width: 1180px) {
	.shell {
		grid-template-columns: minmax(0, 1fr);
		height: calc(100dvh - 48px);
		max-height: none;
	}

	.content {
		margin-top: 8px;
	}
}

@media (max-width: 960px) {
	.shell {
		height: calc(100dvh - 32px);
	}

	.content {
		padding: 24px;
	}
}

@media (max-width: 768px) {
	.shell {
		gap: 20px;
		height: calc(100dvh - 32px);
	}

	.content {
		padding: 20px;
	}
}
</style>
