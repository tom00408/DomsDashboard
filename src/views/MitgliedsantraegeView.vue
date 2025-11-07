<template>
	<section class="antraege-view">
		<header class="view-header">
			<div class="title-block">
				<h2>Mitgliedsanträge</h2>
				<p>
					Übersicht aller eingegangenen Anträge. Die Daten werden live aus Firestore geladen
					und lokal entschlüsselt.
				</p>
			</div>
			<div class="filters">
				<label class="filter search-filter">
					<span>Suche</span>
					<input
						v-model="searchTerm"
						type="search"
						placeholder="Name, Abteilung, E-Mail …"
						:disabled="isLoading"
					/>
				</label>
				<label class="filter status-filter" v-if="statusOptions.length > 1">
					<span>Status</span>
					<select v-model="selectedStatus" :disabled="isLoading">
						<option value="__all">Alle</option>
						<option v-for="status in statusOptions" :key="status" :value="status">
							{{ statusLabel(status) }}
						</option>
					</select>
				</label>
			</div>
		</header>

		<div v-if="!secretAvailable" class="state-card error">
			<h3>Kein Entschlüsselungs-Schlüssel gefunden</h3>
			<p>
				Der Environment-Variable
				<code>VITE_MTV_ANTRAEGE_KEY</code>
				ist nicht gesetzt. Ohne Schlüssel können die Antragsdaten nicht angezeigt werden.
			</p>
		</div>

		<div v-else-if="errorMessage" class="state-card error">
			<h3>Daten konnten nicht geladen werden</h3>
			<p>{{ errorMessage }}</p>
			<button type="button" class="retry-btn" @click="loadAntraege" :disabled="isLoading">
				Erneut versuchen
			</button>
		</div>

		<div v-else class="table-container">
			<div v-if="isLoading" class="overlay">
				<div class="overlay-card">
					<span class="spinner" />
					<p>Lade Antragsdaten …</p>
				</div>
			</div>

			<div class="table-scroll">
				<table>
					<thead>
						<tr>
							<th v-for="column in columns" :key="column.key">
								<button
									class="head-cell"
									type="button"
									@click="toggleSort(column.key)"
								>
									<span>{{ column.label }}</span>
									<span
										class="sort-indicator"
										:class="{
											active: sortField === column.key,
											desc: sortField === column.key && sortDirection === 'desc',
										}"
									/>
								</button>
							</th>
						</tr>
					</thead>
					<tbody>
						<tr v-if="!isLoading && filteredRows.length === 0">
							<td :colspan="columns.length" class="empty">
								Keine Treffer für deine Filter.
							</td>
						</tr>
						<tr v-for="row in filteredRows" :key="row.id">
							<td v-for="column in columns" :key="column.key" data-label="column.label">
								{{ row[column.key] ?? '—' }}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import CryptoJS from 'crypto-js';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../service/firebase';

type EncryptedMitgliedsantrag = Record<string, string | undefined>;

type Mitgliedsantrag = {
	id: string;
	status: string;
	vornamen: string;
	nachnamen: string;
	abteilung: string;
	gehörtZu: string;
	datum: string;
	beginn: string;
	email: string;
	telefon: string;
	plz: string;
	ort: string;
	land: string;
	strasse: string;
	iban: string;
	kreditinstitut: string;
	zahlungsweise: string;
	dsgvo: string;
	socialMedia: string;
	presse: string;
	homepage: string;
	unterschrift: string;
	unterschriftKontoinhaber: string;
	geburtsdatum: string;
	anrede: string;
};

type SortDirection = 'asc' | 'desc';

const secretKey = import.meta.env.VITE_MTV_ANTRAEGE_KEY ?? '';
const secretAvailable = Boolean(secretKey);

const columns = [
	{ key: 'status', label: 'Status', encrypted: false },
	{ key: 'datum', label: 'Datum', encrypted: true },
	{ key: 'beginn', label: 'Beginn', encrypted: true },
	{ key: 'anrede', label: 'Anrede', encrypted: true },
	{ key: 'vornamen', label: 'Vorname', encrypted: true },
	{ key: 'nachnamen', label: 'Nachname', encrypted: true },
	{ key: 'abteilung', label: 'Abteilung', encrypted: true },
	{ key: 'gehörtZu', label: 'Gehört zu', encrypted: true },
	{ key: 'email', label: 'E-Mail', encrypted: true },
	{ key: 'telefon', label: 'Telefon', encrypted: true },
	{ key: 'geburtsdatum', label: 'Geburtsdatum', encrypted: true },
	{ key: 'plz', label: 'PLZ', encrypted: true },
	{ key: 'ort', label: 'Ort', encrypted: true },
	{ key: 'strasse', label: 'Straße', encrypted: true },
	{ key: 'land', label: 'Land', encrypted: true },
	{ key: 'iban', label: 'IBAN', encrypted: true },
	{ key: 'kreditinstitut', label: 'Kreditinstitut', encrypted: true },
	{ key: 'zahlungsweise', label: 'Zahlungsweise', encrypted: true },
	{ key: 'dsgvo', label: 'DSGVO', encrypted: true },
	{ key: 'socialMedia', label: 'Social Media', encrypted: true },
	{ key: 'presse', label: 'Presse', encrypted: true },
	{ key: 'homepage', label: 'Homepage', encrypted: true },
	{ key: 'unterschrift', label: 'Unterschrift Mitglied', encrypted: true },
	{ key: 'unterschriftKontoinhaber', label: 'Unterschrift Kontoinhaber', encrypted: true },
] as const;

const dataRows = ref<Mitgliedsantrag[]>([]);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);
const searchTerm = ref('');
const selectedStatus = ref<string>('__all');
const sortField = ref<string>('datum');
const sortDirection = ref<SortDirection>('desc');

const statusOptions = computed(() => {
	const statuses = new Set<string>();
	dataRows.value.forEach((row) => {
		if (row.status) statuses.add(row.status);
	});
	return Array.from(statuses.values()).sort((a, b) => a.localeCompare(b));
});

const decrypt = (value: string | undefined) => {
	if (!value) return '';
	if (!secretAvailable) return '';
	try {
		const decrypted = CryptoJS.AES.decrypt(value, secretKey);
		const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
		return plaintext || '';
	} catch (error) {
		console.warn('Entschlüsselung fehlgeschlagen', error);
		return '';
	}
};

const sanitizeDate = (value: string) => {
	if (!value) return '';
	const date = new Date(value);
	if (!Number.isNaN(date.getTime())) {
		return new Intl.DateTimeFormat('de-DE', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		}).format(date);
	}
	return value;
};

const normalizeRow = (
	id: string,
	payload: EncryptedMitgliedsantrag
): Mitgliedsantrag => ({
	id,
	status: payload.status ?? 'unbekannt',
	datum: sanitizeDate(decrypt(payload.datum)),
	beginn: sanitizeDate(decrypt(payload.beginn)),
	anrede: decrypt(payload.anrede),
	vornamen: decrypt(payload.vorname),
	nachnamen: decrypt(payload.nachname),
	abteilung: decrypt(payload.abteilung),
	gehörtZu: decrypt(payload.gehörtZu),
	email: decrypt(payload.email),
	telefon: decrypt(payload.telefon),
	geburtsdatum: sanitizeDate(decrypt(payload.geburtsdatum)),
	plz: decrypt(payload.plz),
	ort: decrypt(payload.ort),
	strasse: decrypt(payload.strasse),
	land: decrypt(payload.land),
	iban: decrypt(payload.iban),
	kreditinstitut: decrypt(payload.kreditinstitut),
	zahlungsweise: decrypt(payload.zahlungsweise),
	dsgvo: decrypt(payload.dsgvo),
	socialMedia: decrypt(payload.socialMedia),
	presse: decrypt(payload.presse),
	homepage: decrypt(payload.homepage),
	unterschrift: decrypt(payload.unterschrift),
	unterschriftKontoinhaber: decrypt(payload.unterschriftKontoinhaber),
});

const sortRows = (rows: Mitgliedsantrag[]) => {
	const field = sortField.value;
	const direction = sortDirection.value;
	const multiplier = direction === 'asc' ? 1 : -1;

	return [...rows].sort((a, b) => {
		const valueA = String(a[field as keyof Mitgliedsantrag] ?? '').toLowerCase();
		const valueB = String(b[field as keyof Mitgliedsantrag] ?? '').toLowerCase();

		if (valueA === valueB) return 0;
		return valueA > valueB ? multiplier : -multiplier;
	});
};

const filteredRows = computed(() => {
	const rows = dataRows.value;
	const term = searchTerm.value.trim().toLowerCase();
	const status = selectedStatus.value;

	let filtered = rows;

	if (status !== '__all') {
		filtered = filtered.filter((row) => row.status === status);
	}

	if (term) {
		filtered = filtered.filter((row) =>
			columns.some((column) => {
				const value = String(row[column.key as keyof Mitgliedsantrag] ?? '').toLowerCase();
				return value.includes(term);
			})
		);
	}

	return sortRows(filtered);
});

const toggleSort = (field: string) => {
	if (sortField.value === field) {
		sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
	} else {
		sortField.value = field;
		sortDirection.value = 'asc';
	}
};

const statusLabel = (status: string) => {
	if (!status) return 'Unbekannt';
	const normalized = status.toLowerCase();
	switch (normalized) {
		case 'open':
			return 'Offen';
		case 'archived':
			return 'Archiviert';
		case 'processing':
			return 'In Bearbeitung';
		default:
			return status.charAt(0).toUpperCase() + status.slice(1);
	}
};

const loadAntraege = async () => {
	if (!secretAvailable) return;
	isLoading.value = true;
	errorMessage.value = null;

	try {
		const mitgliedsantraegeRef = collection(db, 'mitgliedsantraege');
		const q = query(mitgliedsantraegeRef);
		const snapshot = await getDocs(q);

		const rows: Mitgliedsantrag[] = snapshot.docs.map((doc) =>
			normalizeRow(doc.id, doc.data() as EncryptedMitgliedsantrag)
		);

		dataRows.value = sortRows(rows);
	} catch (error) {
		console.error('Fehler beim Laden der Mitgliedsanträge', error);
		errorMessage.value =
			error instanceof Error
				? error.message
				: 'Unbekannter Fehler beim Laden der Mitgliedsanträge.';
	} finally {
		isLoading.value = false;
	}
};

if (secretAvailable) {
	loadAntraege();
}
</script>

<style scoped>
.antraege-view {
	display: flex;
	flex-direction: column;
	gap: 24px;
	min-height: 100%;
}

.view-header {
	display: flex;
	flex-wrap: wrap;
	gap: 20px;
	align-items: flex-end;
	justify-content: space-between;
	padding: 24px 28px;
	background: var(--color-surface-elevated);
	border-radius: var(--border-radius-md);
	border: 1px solid var(--color-border);
	box-shadow: var(--shadow-soft);
}

.title-block h2 {
	margin: 0 0 8px;
	font-size: 1.9rem;
	font-weight: var(--font-weight-semibold);
	color: var(--color-text-primary);
}

.title-block p {
	margin: 0;
	max-width: 60ch;
	color: var(--color-text-secondary);
}

.filters {
	display: flex;
	gap: 16px;
	align-items: flex-end;
}

.filter {
	display: flex;
	flex-direction: column;
	gap: 6px;
	font-size: 0.85rem;
	color: var(--color-text-secondary);
}

.filter input,
.filter select {
	min-width: 220px;
	padding: 10px 14px;
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

.filter input:focus-visible,
.filter select:focus-visible {
	outline: none;
	border-color: color-mix(
		in srgb,
		var(--color-logo-red) 70%,
		var(--color-contrast-dark) 30%
	);
	box-shadow: 0 0 0 3px
		color-mix(in srgb, var(--color-highlight) 25%, var(--color-transparent));
}

.filter input:disabled,
.filter select:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.table-container {
	position: relative;
	border-radius: var(--border-radius-md);
	border: 1px solid var(--color-border);
	box-shadow: var(--shadow-soft);
	background: color-mix(
		in srgb,
		var(--color-surface) 88%,
		var(--color-glass) 12%
	);
	overflow: hidden;
}

.table-scroll {
	overflow: auto;
	max-height: calc(100dvh - 240px);
}

table {
	width: 100%;
	border-collapse: collapse;
	min-width: 1200px;
}

thead {
	position: sticky;
	top: 0;
	z-index: 2;
}

th {
	padding: 0;
	background: color-mix(
		in srgb,
		var(--color-logo-red) 24%,
		var(--color-contrast-dark) 76%
	);
	color: var(--color-contrast-light);
	text-align: left;
	font-size: 0.8rem;
	letter-spacing: 0.1em;
	text-transform: uppercase;
}

.head-cell {
	width: 100%;
	padding: 14px 18px;
	display: flex;
	align-items: center;
	gap: 10px;
	background: transparent;
	border: none;
	color: inherit;
	font: inherit;
	cursor: pointer;
	justify-content: space-between;
}

.head-cell:hover .sort-indicator,
.head-cell:focus-visible .sort-indicator {
	opacity: 1;
}

.sort-indicator {
	width: 10px;
	height: 16px;
	background: linear-gradient(
		to bottom,
		color-mix(in srgb, var(--color-contrast-light) 80%, var(--color-transparent)) 50%,
		color-mix(in srgb, var(--color-contrast-light) 30%, var(--color-transparent)) 50%
	);
	mask: url("data:image/svg+xml,%3Csvg viewBox='0 0 10 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 0l5 6H0L5 0zm0 16l5-6H0l5 6z' fill='%23000'/%3E%3C/svg%3E")
		no-repeat center / contain;
	opacity: 0.35;
	transition: opacity var(--transition-default), transform var(--transition-default);
}

.sort-indicator.active {
	opacity: 1;
}

.sort-indicator.active.desc {
	transform: rotate(180deg);
}

tbody tr {
	background: color-mix(
		in srgb,
		var(--color-surface) 95%,
		var(--color-accent-gray) 5%
	);
	transition: background var(--transition-default);
}

tbody tr:nth-child(even) {
	background: color-mix(
		in srgb,
		var(--color-surface) 88%,
		var(--color-accent-gray) 12%
	);
}

tbody tr:hover {
	background: color-mix(
		in srgb,
		var(--color-highlight) 14%,
		var(--color-surface) 86%
	);
}

td {
	padding: 14px 18px;
	border-bottom: 1px solid var(--color-border);
	font-size: 0.95rem;
	color: var(--color-text-primary);
	vertical-align: top;
}

td::before {
	content: attr(data-label);
	display: none;
	font-size: 0.75rem;
	color: var(--color-text-secondary);
	text-transform: uppercase;
	letter-spacing: 0.08em;
	margin-bottom: 6px;
}

.empty {
	text-align: center;
	padding: 28px 18px;
	color: var(--color-text-secondary);
}

.overlay {
	position: absolute;
	inset: 0;
	display: grid;
	place-items: center;
	background: color-mix(
		in srgb,
		var(--color-surface) 40%,
		var(--color-transparent) 60%
	);
	z-index: 3;
	backdrop-filter: blur(4px);
}

.overlay-card {
	display: inline-flex;
	align-items: center;
	gap: 12px;
	padding: 14px 18px;
	border-radius: var(--border-radius-sm);
	border: 1px solid var(--color-border);
	background: var(--color-surface);
	box-shadow: var(--shadow-soft);
	color: var(--color-text-primary);
}

.spinner {
	width: 18px;
	height: 18px;
	border-radius: 50%;
	border: 3px solid color-mix(
			in srgb,
			var(--color-contrast-light) 70%,
			var(--color-accent-gray) 30%
		);
	border-top-color: color-mix(
		in srgb,
		var(--color-logo-red) 68%,
		var(--color-contrast-dark) 32%
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

.state-card {
	padding: 32px;
	border-radius: var(--border-radius-md);
	border: 1px solid var(--color-border);
	background: color-mix(
		in srgb,
		var(--color-surface) 92%,
		var(--color-glass) 8%
	);
	box-shadow: var(--shadow-soft);
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.state-card.error {
	border-color: color-mix(
		in srgb,
		var(--color-logo-red) 55%,
		var(--color-contrast-dark) 45%
	);
}

.state-card h3 {
	margin: 0;
	font-size: 1.3rem;
}

.retry-btn {
	align-self: flex-start;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	border-radius: var(--border-radius-sm);
	border: none;
	background: color-mix(
		in srgb,
		var(--color-logo-red) 72%,
		var(--color-dark-red) 28%
	);
	color: var(--color-contrast-light);
	cursor: pointer;
	font-weight: var(--font-weight-medium);
	transition: transform var(--transition-default), box-shadow var(--transition-default);
}

.retry-btn:hover,
.retry-btn:focus-visible {
	transform: translateY(-2px);
	box-shadow: var(--shadow-soft);
	outline: none;
}

@media (max-width: 1080px) {
	.table-scroll {
		max-height: calc(100dvh - 280px);
	}
}

@media (max-width: 860px) {
	.view-header {
		flex-direction: column;
		align-items: stretch;
	}

	.filters {
		width: 100%;
		gap: 12px;
	}

	.filter input,
	.filter select {
		width: 100%;
		min-width: 0;
	}

	table {
		min-width: 960px;
	}
}

@media (max-width: 640px) {
	.table-scroll {
		max-height: calc(100dvh - 320px);
	}

	td {
		padding: 12px 14px;
	}
}
</style>

