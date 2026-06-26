<template>
	<div class="einstellungen-container">
		<header class="einstellungen-header">
			<h2>Einstellungen</h2>
			<p class="einstellungen-subtitle">Custom-Status für Bestellungen, Mitgliedsanträge und FÖV-Anträge verwalten.</p>
		</header>

		<div v-if="loading" class="overlay">
			<div class="overlay-card">
				<span class="spinner" />
				<p>Einstellungen werden geladen …</p>
			</div>
		</div>

		<template v-else>
			<section class="status-section">
				<h3>Bestellungen</h3>
				<p class="section-desc">Feste Status (nicht löschbar): Neu, In Bearbeitung, Abgeschlossen. Zusätzlich können eigene Status angelegt werden.</p>
				<div class="status-list">
					<div
						v-for="value in baseOrderStatuses"
						:key="value"
						class="status-chip base"
					>
						<span>{{ getOrderStatusLabel(value) }}</span>
						<span class="chip-badge">Standard</span>
					</div>
					<div
						v-for="value in customStatuses.order"
						:key="value"
						class="status-chip custom"
					>
						<span>{{ getOrderStatusLabel(value) }}</span>
						<button
							type="button"
							class="chip-remove"
							@click="removeStatus('order', value)"
							title="Status entfernen"
							aria-label="Status entfernen"
						>
							×
						</button>
					</div>
				</div>
				<div class="add-row">
					<input
						v-model="newOrderLabel"
						type="text"
						placeholder="z. B. Warten auf Lieferung"
						class="add-input"
						@keydown.enter="addStatus('order')"
					/>
					<button
						type="button"
						class="add-btn"
						:disabled="!newOrderLabel.trim() || saving"
						@click="addStatus('order')"
					>
						Hinzufügen
					</button>
				</div>
			</section>

			<section class="status-section">
				<h3>Mitgliedsanträge</h3>
				<p class="section-desc">Feste Status: Ausgewählt, Neu, Archiviert. Zusätzlich können eigene Status angelegt werden.</p>
				<div class="status-list">
					<div
						v-for="value in baseMitgliedsantragStatuses"
						:key="value"
						class="status-chip base"
					>
						<span>{{ getMitgliedsantragStatusLabel(value) }}</span>
						<span class="chip-badge">Standard</span>
					</div>
					<div
						v-for="value in customStatuses.mitgliedsantrag"
						:key="value"
						class="status-chip custom"
					>
						<span>{{ getMitgliedsantragStatusLabel(value) }}</span>
						<button
							type="button"
							class="chip-remove"
							@click="removeStatus('mitgliedsantrag', value)"
							title="Status entfernen"
							aria-label="Status entfernen"
						>
							×
						</button>
					</div>
				</div>
				<div class="add-row">
					<input
						v-model="newMitgliedsantragLabel"
						type="text"
						placeholder="z. B. In Prüfung"
						class="add-input"
						@keydown.enter="addStatus('mitgliedsantrag')"
					/>
					<button
						type="button"
						class="add-btn"
						:disabled="!newMitgliedsantragLabel.trim() || saving"
						@click="addStatus('mitgliedsantrag')"
					>
						Hinzufügen
					</button>
				</div>
			</section>

			<section class="status-section">
				<h3>FÖV Mitgliedsanträge</h3>
				<p class="section-desc">Feste Status: Neu, In Bearbeitung, Genehmigt, Abgelehnt. Zusätzlich können eigene Status angelegt werden.</p>
				<div class="status-list">
					<div
						v-for="value in baseFoevStatuses"
						:key="value"
						class="status-chip base"
					>
						<span>{{ getFoevStatusLabel(value) }}</span>
						<span class="chip-badge">Standard</span>
					</div>
					<div
						v-for="value in customStatuses.foevMitgliedsantrag"
						:key="value"
						class="status-chip custom"
					>
						<span>{{ getFoevStatusLabel(value) }}</span>
						<button
							type="button"
							class="chip-remove"
							@click="removeStatus('foevMitgliedsantrag', value)"
							title="Status entfernen"
							aria-label="Status entfernen"
						>
							×
						</button>
					</div>
				</div>
				<div class="add-row">
					<input
						v-model="newFoevLabel"
						type="text"
						placeholder="z. B. Rückfrage"
						class="add-input"
						@keydown.enter="addStatus('foevMitgliedsantrag')"
					/>
					<button
						type="button"
						class="add-btn"
						:disabled="!newFoevLabel.trim() || saving"
						@click="addStatus('foevMitgliedsantrag')"
					>
						Hinzufügen
					</button>
				</div>
			</section>
		</template>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
	BASE_ORDER_STATUSES,
	BASE_MITGLIEDSAANTRAG_STATUSES,
	BASE_FOEV_STATUSES,
	getCustomStatuses,
	addCustomStatus,
	removeCustomStatus,
	getOrderStatusLabel,
	getMitgliedsantragStatusLabel,
	getFoevStatusLabel,
	type CustomStatusesData,
} from '../service/settingsService';

const loading = ref(true);
const saving = ref(false);
const customStatuses = ref<CustomStatusesData>({
	order: [],
	mitgliedsantrag: [],
	foevMitgliedsantrag: [],
});

const baseOrderStatuses = [...BASE_ORDER_STATUSES];
const baseMitgliedsantragStatuses = [...BASE_MITGLIEDSAANTRAG_STATUSES];
const baseFoevStatuses = [...BASE_FOEV_STATUSES];

const newOrderLabel = ref('');
const newMitgliedsantragLabel = ref('');
const newFoevLabel = ref('');

async function load() {
	loading.value = true;
	try {
		customStatuses.value = await getCustomStatuses();
	} catch (e) {
		console.error('Einstellungen laden fehlgeschlagen', e);
		alert('Einstellungen konnten nicht geladen werden.');
	} finally {
		loading.value = false;
	}
}

type Category = keyof CustomStatusesData;

async function addStatus(category: Category) {
	const label =
		category === 'order'
			? newOrderLabel.value
			: category === 'mitgliedsantrag'
				? newMitgliedsantragLabel.value
				: newFoevLabel.value;
	const trimmed = label.trim();
	if (!trimmed) return;

	saving.value = true;
	try {
		await addCustomStatus(category, trimmed);
		customStatuses.value = await getCustomStatuses();
		if (category === 'order') newOrderLabel.value = '';
		else if (category === 'mitgliedsantrag') newMitgliedsantragLabel.value = '';
		else newFoevLabel.value = '';
	} catch (e) {
		console.error('Status hinzufügen fehlgeschlagen', e);
		alert('Status konnte nicht hinzugefügt werden.');
	} finally {
		saving.value = false;
	}
}

async function removeStatus(category: Category, value: string) {
	if (!confirm(`Status „${value}“ wirklich entfernen?`)) return;
	saving.value = true;
	try {
		await removeCustomStatus(category, value);
		customStatuses.value = await getCustomStatuses();
	} catch (e) {
		console.error('Status entfernen fehlgeschlagen', e);
		alert('Status konnte nicht entfernt werden.');
	} finally {
		saving.value = false;
	}
}

onMounted(() => {
	load();
});
</script>

<style scoped>
.einstellungen-container {
	position: relative;
	max-width: 720px;
}

.einstellungen-header {
	margin-bottom: 28px;
}

.einstellungen-header h2 {
	margin: 0 0 8px;
	font-size: 1.6rem;
	font-weight: 600;
	color: var(--color-text-primary);
}

.einstellungen-subtitle {
	margin: 0;
	font-size: 0.95rem;
	color: var(--color-text-secondary);
}

.overlay {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: color-mix(
		in srgb,
		var(--color-surface) 85%,
		var(--color-transparent) 15%
	);
	border-radius: var(--border-radius-lg);
}

.overlay-card {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 18px 22px;
	background: var(--color-surface-elevated);
	border: 1px solid var(--color-border);
	border-radius: var(--border-radius-sm);
	box-shadow: var(--shadow-soft);
}

.overlay-card p {
	margin: 0;
	font-weight: 500;
	color: var(--color-text-primary);
}

.spinner {
	width: 20px;
	height: 20px;
	border-radius: 50%;
	border: 2px solid var(--color-border);
	border-top-color: var(--color-highlight);
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.status-section {
	margin-bottom: 32px;
	padding: 20px 24px;
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: var(--border-radius-lg);
	box-shadow: var(--shadow-soft);
}

.status-section h3 {
	margin: 0 0 8px;
	font-size: 1.15rem;
	font-weight: 600;
	color: var(--color-text-primary);
}

.section-desc {
	margin: 0 0 16px;
	font-size: 0.9rem;
	color: var(--color-text-secondary);
	line-height: 1.4;
}

.status-list {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-bottom: 16px;
}

.status-chip {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	border-radius: var(--border-radius-sm);
	font-size: 0.9rem;
	font-weight: 500;
}

.status-chip.base {
	background: color-mix(
		in srgb,
		var(--color-accent-gray) 50%,
		var(--color-surface) 50%
	);
	color: var(--color-text-primary);
	border: 1px solid var(--color-border);
}

.status-chip.custom {
	background: color-mix(
		in srgb,
		var(--color-highlight) 18%,
		var(--color-surface) 82%
	);
	color: var(--color-text-primary);
	border: 1px solid color-mix(
		in srgb,
		var(--color-highlight) 40%,
		var(--color-border) 60%
	);
}

.chip-badge {
	font-size: 0.7rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--color-text-secondary);
}

.chip-remove {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	padding: 0;
	border: none;
	border-radius: 50%;
	background: color-mix(
		in srgb,
		var(--color-contrast-dark) 15%,
		var(--color-transparent) 85%
	);
	color: var(--color-text-primary);
	font-size: 1.2rem;
	line-height: 1;
	cursor: pointer;
	transition: background 0.15s ease;
}

.chip-remove:hover {
	background: color-mix(
		in srgb,
		var(--color-logo-red) 25%,
		var(--color-transparent) 75%
	);
}

.add-row {
	display: flex;
	gap: 10px;
	align-items: center;
}

.add-input {
	flex: 1;
	min-width: 0;
	padding: 10px 14px;
	border: 1px solid var(--color-border);
	border-radius: var(--border-radius-sm);
	background: var(--color-surface-elevated);
	color: var(--color-text-primary);
	font-size: 0.95rem;
}

.add-input::placeholder {
	color: var(--color-text-secondary);
}

.add-input:focus {
	outline: none;
	border-color: var(--color-highlight);
	box-shadow: 0 0 0 2px color-mix(
		in srgb,
		var(--color-highlight) 25%,
		var(--color-transparent) 75%
	);
}

.add-btn {
	padding: 10px 18px;
	border: 1px solid var(--color-highlight);
	border-radius: var(--border-radius-sm);
	background: color-mix(
		in srgb,
		var(--color-highlight) 20%,
		var(--color-surface) 80%
	);
	color: var(--color-text-primary);
	font-weight: 500;
	cursor: pointer;
	transition: background 0.15s ease, transform 0.1s ease;
}

.add-btn:hover:not(:disabled) {
	background: color-mix(
		in srgb,
		var(--color-highlight) 35%,
		var(--color-surface) 65%
	);
}

.add-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}
</style>
