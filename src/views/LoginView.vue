<template>
	<section class="login">
		<div class="login-card">
			<header class="login-header">
				<h1>MTV Geismar</h1>
				<p>Bitte melde dich mit deinem Vereinsaccount an.</p>
			</header>
			<form class="login-form" @submit.prevent="handleLogin">
				<label class="field">
					<span>E-Mail-Adresse</span>
					<input
						v-model="email"
						type="email"
						name="email"
						autocomplete="email"
						required
						:disabled="isSubmitting"
						placeholder="vorname.nachname@mtv-geismar.de"
					/>
				</label>
				<label class="field">
					<span>Passwort</span>
					<input
						v-model="password"
						type="password"
						name="password"
						autocomplete="current-password"
						required
						minlength="6"
						:disabled="isSubmitting"
						placeholder="••••••••"
					/>
				</label>
				<p v-if="errorMessage" class="error">{{ errorMessage }}</p>
				<button class="submit" type="submit" :disabled="isSubmitting">
					<span v-if="!isSubmitting">Anmelden</span>
					<span v-else class="loading">
						<span class="dot" />
						<span class="dot" />
						<span class="dot" />
					</span>
				</button>
			</form>
			<footer class="login-footer">
				<p>Kontaktier das Büro, wenn du noch keinen Zugang hast.</p>
			</footer>
		</div>
	</section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../service/firebase';

const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

const handleLogin = async () => {
	if (isSubmitting.value) return;
	isSubmitting.value = true;
	errorMessage.value = null;

	try {
		await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
	} catch (error) {
		const message =
			error instanceof Error
				? error.message
				: 'Anmeldung fehlgeschlagen. Bitte prüfe deine Eingaben.';
		errorMessage.value = message;
	} finally {
		isSubmitting.value = false;
	}
};
</script>

<style scoped>
.login {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	width: 100%;
	background: var(--color-background-gradient);
	padding: 24px;
	margin: 0 auto;
}

.login-card {
	width: min(420px, 100%);
	display: flex;
	flex-direction: column;
	gap: 24px;
	padding: 40px 36px;
	border-radius: var(--border-radius-lg);
	background: color-mix(
		in srgb,
		var(--color-surface) 80%,
		var(--color-glass) 20%
	);
	border: 1px solid var(--color-border);
	box-shadow: var(--shadow-soft);
	backdrop-filter: blur(10px);
}

.login-header h1 {
	margin: 0;
	font-size: 2rem;
	font-weight: var(--font-weight-semibold);
	color: var(--color-text-primary);
}

.login-header p {
	margin: 8px 0 0;
	color: var(--color-text-secondary);
	line-height: 1.5;
}

.login-form {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.field {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.field span {
	font-size: 0.9rem;
	color: var(--color-text-secondary);
	font-weight: var(--font-weight-medium);
}

.field input {
	width: 100%;
	padding: 12px 14px;
	border-radius: var(--border-radius-sm);
	border: 1px solid var(--color-border);
	background: color-mix(
		in srgb,
		var(--color-contrast-light) 92%,
		var(--color-accent-gray) 8%
	);
	color: var(--color-text-primary);
	font-size: 0.95rem;
	transition: border-color var(--transition-default), box-shadow var(--transition-default);
}

.field input:focus-visible {
	outline: none;
	border-color: color-mix(
		in srgb,
		var(--color-logo-red) 70%,
		var(--color-contrast-dark) 30%
	);
	box-shadow: 0 0 0 3px
		color-mix(in srgb, var(--color-highlight) 35%, var(--color-transparent));
}

.field input:disabled {
	opacity: 0.6;
}

.error {
	margin: 0;
	color: color-mix(
		in srgb,
		var(--color-logo-red) 70%,
		var(--color-contrast-dark) 30%
	);
	font-size: 0.9rem;
}

.submit {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 12px 18px;
	border: none;
	border-radius: var(--border-radius-sm);
	background: color-mix(
		in srgb,
		var(--color-logo-red) 72%,
		var(--color-dark-red) 28%
	);
	color: var(--color-contrast-light);
	font-size: 0.95rem;
	font-weight: var(--font-weight-semibold);
	cursor: pointer;
	transition: transform var(--transition-default),
		box-shadow var(--transition-default),
		background var(--transition-default);
	box-shadow: var(--shadow-soft);
}

.submit:hover:not(:disabled),
.submit:focus-visible:not(:disabled) {
	transform: translateY(-2px);
	background: color-mix(
		in srgb,
		var(--color-logo-red) 58%,
		var(--color-contrast-dark) 42%
	);
	outline: none;
}

.submit:disabled {
	cursor: wait;
	opacity: 0.75;
}

.loading {
	display: inline-flex;
	align-items: center;
	gap: 6px;
}

.dot {
	width: 6px;
	height: 6px;
	border-radius: 999px;
	background: var(--color-contrast-light);
	animation: bounce 0.8s infinite ease-in-out;
}

.dot:nth-child(2) {
	animation-delay: 0.12s;
}

.dot:nth-child(3) {
	animation-delay: 0.24s;
}

@keyframes bounce {
	0%,
	80%,
	100% {
		transform: translateY(0);
		opacity: 0.8;
	}
	40% {
		transform: translateY(-6px);
		opacity: 1;
	}
}

.login-footer {
	font-size: 0.85rem;
	color: var(--color-text-secondary);
	text-align: center;
}

@media (max-width: 540px) {
	.login-card {
		padding: 32px 24px;
	}
}
</style>

