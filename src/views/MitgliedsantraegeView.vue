<template>
	<div class="mitglied-container">
		<header class="header-section">
			<div class="stats-section">
				<div class="stat-card">
					<span class="stat-number">{{ antraege.length }}</span>
					<span class="stat-label">Gesamt</span>
				</div>
				<div class="stat-card">
					<span class="stat-number">{{ getStatusCount('new') }}</span>
					<span class="stat-label">Neu</span>
				</div>
				<div class="stat-card">
					<span class="stat-number">{{ getStatusCount('processing') }}</span>
					<span class="stat-label">In Bearbeitung</span>
				</div>
				<div class="stat-card">
					<span class="stat-number">{{ getStatusCount('archived') }}</span>
					<span class="stat-label">Archiviert</span>
				</div>
			</div>
			<div class="header-actions">
				<button @click="refreshData" class="refresh-btn" :disabled="loading || !secretAvailable">
					{{ loading ? 'Lädt…' : 'Aktualisieren' }}
				</button>
				<button
					@click="exportToCSV()"
					class="export-btn"
					:disabled="filteredAntraege.length === 0 || !secretAvailable"
				>
					CSV Export
				</button>
				<button
					@click="openAdvancedExport"
					class="export-btn"
					:disabled="filteredAntraege.length === 0 || !secretAvailable"
				>
					Erweiterter CSV Export
				</button>
			</div>
		</header>

		<div v-if="!secretAvailable" class="state-card error">
			<h3>Entschlüsselung nicht möglich</h3>
			<p>
				Der Environment-Variable
				<code>VITE_MTV_ANTRAEGE_KEY</code>
				fehlt. Ohne Schlüssel lassen sich die Mitgliedsanträge nicht entschlüsseln.
			</p>
		</div>

		<template v-else>
			<div class="filter-section">
				<div class="filter-row">
					<input
						v-model="searchTerm"
						placeholder="Suchen (Name, E-Mail, Ort …)"
						class="search-input"
						:disabled="loading"
						type="search"
						autocomplete="off"
					/>
					<select v-model="statusFilter" class="status-filter" :disabled="loading">
						<option value="">Alle Status</option>
						<option v-for="status in statusOptions" :key="status" :value="status">
							{{ statusLabel(status) }}
						</option>
					</select>
				</div>
			</div>

			<div class="table-container">
				<div v-if="loading" class="overlay">
					<div class="overlay-card">
						<span class="spinner" />
						<p>Lade Antragsdaten …</p>
					</div>
				</div>

				<div class="table-scroll">
					<table class="mitglied-table">
						<thead>
							<tr>
								<th>Status</th>
								<th
									v-for="column in dataColumns"
									:key="column.key"
									:class="['column-head', column.className]"
								>
									{{ column.label }}
								</th>
								<th class="actions-head">Aktionen</th>
							</tr>
						</thead>
						<tbody>
							<tr v-if="!loading && filteredAntraege.length === 0">
								<td :colspan="dataColumns.length + 2" class="empty">
									Keine Einträge gefunden.
								</td>
							</tr>
							<tr
								v-for="antrag in filteredAntraege"
								:key="antrag.id"
								:class="getRowClass(antrag.status)"
							>
								<td class="status-cell">
									<select
										class="status-select"
										:value="antrag.status"
										@change="onStatusChange(antrag.id, $event)"
									>
										<option v-for="status in statusOptions" :key="status" :value="status">
											{{ statusLabel(status) }}
										</option>
									</select>
								</td>
								<td
									v-for="column in dataColumns"
								:key="column.key"
									:data-label="column.label"
								:class="['column-cell', column.className]"
								>
									<template v-if="column.editable">
										<input
											class="table-input"
											:type="column.type ?? 'text'"
											:value="antrag[column.key] ?? ''"
											@blur="onFieldBlur(antrag.id, column.key as EditableField, $event)"
											:placeholder="column.placeholder ?? ''"
											:step="column.type === 'number' ? '0.01' : undefined"
										/>
									</template>
									<template v-else>
										{{ formatDisplay(antrag[column.key]) }}
									</template>
								</td>
								<td class="actions-cell">
									<button
										type="button"
										class="delete-btn"
										title="Antrag löschen"
										@click="deleteAntrag(antrag.id)"
									>
										🗑️
									</button>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</template>

		<div v-if="exportModalOpen" class="export-modal-backdrop">
			<div class="export-modal" role="dialog" aria-modal="true">
				<header class="export-modal-header">
					<h3>Erweiterter CSV-Export</h3>
					<button class="close-btn" type="button" @click="cancelAdvancedExport">✕</button>
				</header>
				<div class="export-modal-body">
					<label class="export-field">
						<span>Dateiname</span>
						<input
							v-model="exportFilename"
							type="text"
							placeholder="mitgliedsantraege-export.csv"
							autocomplete="off"
						/>
					</label>
					<label class="export-field">
						<span>Trennzeichen</span>
						<select v-model="exportDelimiter">
							<option v-for="option in delimiterOptions" :key="option.value" :value="option.value">
								{{ option.label }}
							</option>
						</select>
					</label>
					<div class="export-columns">
						<p>Spalten auswählen:</p>
						<div class="export-column-list">
							<label
								v-for="column in allExportColumns"
								:key="column.key"
								class="export-column-item"
							>
								<input
									v-model="selectedColumns"
									type="checkbox"
									:value="String(column.key)"
								/>
								<span>{{ column.label }}</span>
							</label>
						</div>
					</div>
				</div>
				<footer class="export-modal-footer">
					<button type="button" class="cancel-btn" @click="cancelAdvancedExport">
						Abbrechen
					</button>
					<button type="button" class="confirm-btn" @click="confirmAdvancedExport">
						Export starten
					</button>
				</footer>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import CryptoJS from 'crypto-js';
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../service/firebase';

type AntragStatus =
	| 'open'
	| 'processing'
	| 'archived'
	| 'new'
	| 'approved'
	| 'rejected'
	| string;

const secretKey = import.meta.env.VITE_MTV_ANTRAEGE_KEY ?? '';
const secretAvailable = Boolean(secretKey);

interface Mitgliedsantrag {
	id: string;
	status: AntragStatus;
	datum?: string;
	beginn?: string;
	anrede?: string;
	vorname?: string;
	nachname?: string;
	abteilung?: string;
	'gehörtZu'?: string;
	email?: string;
	telefon?: string;
	geburtsdatum?: string;
	plz?: string;
	ort?: string;
	strasse?: string;
	land?: string;
	iban?: string;
	kreditinstitut?: string;
	zahlungsweise?: string;
	dsgvo?: string;
	socialMedia?: string;
	presse?: string;
	homepage?: string;
	unterschrift?: string;
	unterschriftKontoinhaber?: string;
}

const encryptedFields = [
	'datum',
	'beginn',
	'anrede',
	'vorname',
	'nachname',
	'abteilung',
	'gehörtZu',
	'email',
	'telefon',
	'geburtsdatum',
	'plz',
	'ort',
	'strasse',
	'land',
	'iban',
	'kreditinstitut',
	'zahlungsweise',
	'dsgvo',
	'socialMedia',
	'presse',
	'homepage',
	'unterschrift',
	'unterschriftKontoinhaber',
] as const;

type EncryptedField = (typeof encryptedFields)[number];

const editableFields = [
	'anrede',
	'vorname',
	'nachname',
	'abteilung',
	'gehörtZu',
	'email',
	'telefon',
	'geburtsdatum',
	'plz',
	'ort',
	'strasse',
	'land',
	'iban',
	'kreditinstitut',
	'zahlungsweise',
	'socialMedia',
	'presse',
	'homepage',
	'unterschrift',
	'unterschriftKontoinhaber',
] as const;

type EditableField = (typeof editableFields)[number];

const dateFields: readonly EncryptedField[] = ['datum', 'beginn', 'geburtsdatum'] as const;

const baseStatusOptions: AntragStatus[] = ['open', 'processing', 'archived', 'new'];

interface ColumnDef {
	key: keyof Mitgliedsantrag;
	label: string;
	editable?: boolean;
	type?: 'text' | 'email' | 'number';
	placeholder?: string;
	className?: string;
}

const dataColumns: ColumnDef[] = [
	{ key: 'datum', label: 'Datum', className: 'col-date' },
	{ key: 'beginn', label: 'Beginn', className: 'col-date' },
	{ key: 'anrede', label: 'Anrede', editable: true, className: 'col-short' },
	{ key: 'vorname', label: 'Vorname', editable: true, className: 'col-medium' },
	{ key: 'nachname', label: 'Nachname', editable: true, className: 'col-medium' },
	{ key: 'abteilung', label: 'Abteilung', editable: true, className: 'col-medium' },
	{ key: 'gehörtZu', label: 'Gehört zu', editable: true, className: 'col-medium' },
	{ key: 'email', label: 'E-Mail', editable: true, type: 'email', className: 'col-email' },
	{ key: 'telefon', label: 'Telefon', editable: true, className: 'col-phone' },
	{ key: 'geburtsdatum', label: 'Geburtsdatum', editable: true, className: 'col-date' },
	{ key: 'plz', label: 'PLZ', editable: true, className: 'col-short' },
	{ key: 'ort', label: 'Ort', editable: true, className: 'col-medium' },
	{ key: 'strasse', label: 'Straße', editable: true, className: 'col-street' },
	{ key: 'land', label: 'Land', editable: true, className: 'col-medium' },
	{ key: 'iban', label: 'IBAN', editable: true, className: 'col-iban' },
	{ key: 'kreditinstitut', label: 'Kreditinstitut', editable: true, className: 'col-bank' },
	{ key: 'zahlungsweise', label: 'Zahlungsweise', editable: true, className: 'col-medium' },
	{ key: 'socialMedia', label: 'Social Media', editable: true, className: 'col-medium' },
	{ key: 'presse', label: 'Presse', editable: true, className: 'col-medium' },
	{ key: 'homepage', label: 'Homepage', editable: true, className: 'col-homepage' },
	{ key: 'dsgvo', label: 'DSGVO', className: 'col-short' },
	{ key: 'unterschrift', label: 'Unterschrift Mitglied', editable: true, className: 'col-sign' },
	{
		key: 'unterschriftKontoinhaber',
		label: 'Unterschrift Kontoinhaber',
		editable: true,
		className: 'col-sign',
	},
];

const allExportColumns = computed<ColumnDef[]>(() => [
	{ key: 'status', label: 'Status', className: 'col-status' },
	...dataColumns,
]);

const exportModalOpen = ref(false);
const selectedColumns = ref<string[]>([]);
const exportFilename = ref('');
const exportDelimiter = ref(',');

const delimiterOptions = [
	{ label: 'Komma (,)', value: ',' },
	{ label: 'Semikolon (;)', value: ';' },
	{ label: 'Tabulator (⇥)', value: '\t' },
];

const defaultExportDelimiter = ',' as const;

const defaultExportFilename = () =>
	`mitgliedsantraege-${new Date().toISOString().split('T')[0]}.csv`;

const antraege = ref<Mitgliedsantrag[]>([]);
const loading = ref(false);
const searchTerm = ref('');
const statusFilter = ref<AntragStatus | ''>('');
const errorMessage = ref<string | null>(null);

const normalizedSearch = (value?: string) => value?.toLowerCase() ?? '';

const statusOptions = computed<AntragStatus[]>(() => {
	const set = new Set<AntragStatus>(baseStatusOptions);
	antraege.value.forEach((antrag) => {
		if (antrag.status) {
			set.add(antrag.status);
		}
	});
	return Array.from(set.values());
});

const decryptField = (value?: string) => {
	if (!value || !secretAvailable) return '';
	try {
		const decrypted = CryptoJS.AES.decrypt(value, secretKey);
		return decrypted.toString(CryptoJS.enc.Utf8);
	} catch (error) {
		console.warn('Entschlüsselung fehlgeschlagen', error);
		return '';
	}
};

const encryptField = (value: string) => {
	if (!secretAvailable) return value;
	return CryptoJS.AES.encrypt(value, secretKey).toString();
};

const formatDate = (value?: string) => {
	if (!value) return '';
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return value;
	}
	return parsed.toLocaleDateString('de-DE');
};

const normalizeAntrag = (id: string, data: Record<string, unknown>): Mitgliedsantrag => {
	const result: Mitgliedsantrag = {
		id,
		status: typeof data.status === 'string' ? (data.status as AntragStatus) : 'open',
	};

	encryptedFields.forEach((field) => {
		const encryptedValue = typeof data[field] === 'string' ? (data[field] as string) : '';
		const decryptedValue = decryptField(encryptedValue);
		const formattedValue = dateFields.includes(field)
			? formatDate(decryptedValue)
			: decryptedValue;
		result[field] = formattedValue;
	});

	return result;
};

const filteredAntraege = computed(() => {
	let filtered = [...antraege.value];

	const term = searchTerm.value.trim().toLowerCase();
	if (term) {
		filtered = filtered.filter((antrag) =>
			[
				antrag.vorname,
				antrag.nachname,
				antrag.email,
				antrag.telefon,
				antrag.ort,
				antrag.strasse,
				antrag.abteilung,
			].some((field) => normalizedSearch(field).includes(term))
		);
	}

	if (statusFilter.value) {
		filtered = filtered.filter((antrag) => antrag.status === statusFilter.value);
	}

	return filtered;
});

const parseDateForSort = (value?: string) => {
	if (!value) return 0;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const loadAntraege = async () => {
	if (!secretAvailable) return;

	loading.value = true;
	errorMessage.value = null;

	try {
		const snapshot = await getDocs(collection(db, 'mitgliedsantraege'));
		const entries: Mitgliedsantrag[] = [];

		snapshot.forEach((document) => {
			entries.push(normalizeAntrag(document.id, document.data()));
		});

		entries.sort((a, b) => parseDateForSort(b.datum) - parseDateForSort(a.datum));

		antraege.value = entries;
	} catch (error) {
		console.error('Fehler beim Laden der Mitgliedsanträge', error);
		errorMessage.value =
			error instanceof Error
				? error.message
				: 'Unbekannter Fehler beim Laden der Mitgliedsanträge';
	} finally {
		loading.value = false;
	}
};

const refreshData = () => {
	void loadAntraege();
};

const updateStatus = async (id: string, status: AntragStatus) => {
	try {
		await updateDoc(doc(db, 'mitgliedsantraege', id), { status });
		const antrag = antraege.value.find((entry) => entry.id === id);
		if (antrag) {
			antrag.status = status;
		}
	} catch (error) {
		console.error('Fehler beim Aktualisieren des Status', error);
		alert('Status konnte nicht aktualisiert werden.');
	}
};

const onStatusChange = (id: string, event: Event) => {
	const target = event.target as HTMLSelectElement | null;
	if (!target) return;
	updateStatus(id, target.value as AntragStatus);
};

const updateField = async (id: string, field: EditableField, value: string) => {
	if (!secretAvailable) {
		alert('Kein Entschlüsselungs-Schlüssel vorhanden.');
		return;
	}

	try {
		const encryptedPayload = encryptField(value);
		await updateDoc(doc(db, 'mitgliedsantraege', id), {
			[field]: encryptedPayload,
		});

		const antrag = antraege.value.find((entry) => entry.id === id);
		if (antrag) {
			const formattedValue = dateFields.includes(field as EncryptedField)
				? formatDate(value)
				: value;
			antrag[field] = formattedValue;
		}
	} catch (error) {
		console.error(`Fehler beim Aktualisieren von ${field}`, error);
		alert(`Feld ${field} konnte nicht gespeichert werden.`);
	}
};

const onFieldBlur = (id: string, field: EditableField, event: Event) => {
	const target = event.target as HTMLInputElement | null;
	if (!target) return;
	void updateField(id, field, target.value);
};

const deleteAntrag = async (id: string) => {
	if (!confirm('Mitgliedsantrag wirklich löschen?')) return;

	try {
		await deleteDoc(doc(db, 'mitgliedsantraege', id));
		antraege.value = antraege.value.filter((entry) => entry.id !== id);
	} catch (error) {
		console.error('Fehler beim Löschen des Antrags', error);
		alert('Antrag konnte nicht gelöscht werden.');
	}
};

const escapeForCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

const exportToCSV = (
	columns: ColumnDef[] = allExportColumns.value,
	filename: string = defaultExportFilename(),
	delimiter: string = defaultExportDelimiter
) => {
	const headers = columns.map((column) => column.label).join(delimiter);

	const body = filteredAntraege.value
		.map((antrag) =>
			columns
				.map((column) => {
					const raw = antrag[column.key] ?? '';
					return escapeForCsv(String(raw ?? ''));
				})
				.join(delimiter)
		)
		.join('\n');

	const csvContent = [headers, body].filter(Boolean).join('\n');

	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);
	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};

const getStatusCount = (status: AntragStatus) =>
	antraege.value.filter((antrag) => antrag.status === status).length;

const statusLabel = (status: AntragStatus) => {
	const normalized = status.toLowerCase();
	switch (normalized) {
		case 'open':
			return 'Offen';
		case 'processing':
			return 'In Bearbeitung';
		case 'archived':
			return 'Archiviert';
		case 'new':
			return 'Neu';
		case 'approved':
			return 'Genehmigt';
		case 'rejected':
			return 'Abgelehnt';
		default:
			return status.charAt(0).toUpperCase() + status.slice(1);
	}
};

const getRowClass = (status: AntragStatus) => `status-${status}`;

const formatDisplay = (value?: string) => (value && value.trim().length ? value : '—');

const openAdvancedExport = () => {
	selectedColumns.value = allExportColumns.value.map((column) => String(column.key));
	exportFilename.value = defaultExportFilename();
	exportDelimiter.value = defaultExportDelimiter;
	exportModalOpen.value = true;
};

const confirmAdvancedExport = () => {
	if (selectedColumns.value.length === 0) {
		alert('Bitte mindestens eine Spalte auswählen.');
		return;
	}

	const columns = allExportColumns.value.filter((column) =>
		selectedColumns.value.includes(String(column.key))
	);

	const filename = exportFilename.value.trim() || defaultExportFilename();
	exportToCSV(columns, filename, exportDelimiter.value);
	exportModalOpen.value = false;
};

const cancelAdvancedExport = () => {
	exportModalOpen.value = false;
};

onMounted(() => {
	if (secretAvailable) {
		void loadAntraege();
	}
});
</script>

<style scoped>
.mitglied-container {
	display: flex;
	flex-direction: column;
	gap: 20px;
	min-height: 100%;
}

.header-section {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: stretch;
	justify-content: space-between;
	background: linear-gradient(135deg, #7b1220 0%, #ad1e28 100%);
	padding: 18px 22px;
	border-radius: var(--border-radius-md);
	box-shadow: var(--shadow-soft);
	color: var(--color-contrast-light);
}

.stats-section {
	display: grid;
	grid-auto-flow: column;
	grid-auto-columns: minmax(120px, 1fr);
	gap: 12px;
	align-items: stretch;
}

.stat-card {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 8px;
	padding: 14px 16px;
	border-radius: var(--border-radius-sm);
	border: 1px solid
		color-mix(in srgb, var(--color-contrast-light) 25%, var(--color-transparent) 75%);
	background: color-mix(
		in srgb,
		var(--color-contrast-light) 12%,
		var(--color-transparent) 88%
	);
	color: var(--color-contrast-light);
	backdrop-filter: blur(6px);
}

.stat-number {
	font-size: 1.35rem;
	font-weight: var(--font-weight-semibold);
}

.stat-label {
	font-size: 0.85rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	opacity: 0.85;
}

.header-actions {
	display: flex;
	gap: 10px;
	align-items: center;
}

.refresh-btn,
.export-btn {
	padding: 10px 18px;
	border-radius: var(--border-radius-sm);
	border: none;
	cursor: pointer;
	font-weight: 600;
	font-size: 0.85rem;
	letter-spacing: 0.05em;
	transition: transform var(--transition-default), box-shadow var(--transition-default),
		opacity var(--transition-default);
}

.refresh-btn {
	background: color-mix(
		in srgb,
		var(--color-contrast-light) 20%,
		var(--color-transparent) 80%
	);
	color: var(--color-contrast-light);
	border: 1px solid
		color-mix(in srgb, var(--color-contrast-light) 40%, var(--color-transparent) 60%);
}

.export-btn {
	background: linear-gradient(135deg, #f5b317 0%, #f27f0c 100%);
	color: var(--color-contrast-dark);
	border: 1px solid color-mix(
		in srgb,
		var(--color-contrast-dark) 25%,
		var(--color-contrast-light) 75%
	);
}

.export-btn.secondary {
	background: color-mix(
		in srgb,
		var(--color-contrast-light) 12%,
		var(--color-transparent) 88%
	);
	color: var(--color-contrast-light);
	border: 1px solid color-mix(
		in srgb,
		var(--color-contrast-light) 30%,
		var(--color-transparent) 70%
	);
}

.refresh-btn:hover:not(:disabled),
.export-btn:hover:not(:disabled) {
	transform: translateY(-2px);
	box-shadow: var(--shadow-soft);
}

.refresh-btn:disabled,
.export-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}

.filter-section {
	padding: 24px 28px;
	background: color-mix(
		in srgb,
		var(--color-surface) 92%,
		var(--color-glass) 8%
	);
	border-radius: var(--border-radius-md);
	border: 1px solid var(--color-border);
	box-shadow: var(--shadow-soft);
}

.filter-row {
	display: flex;
	gap: 20px;
	align-items: center;
	flex-wrap: wrap;
}

.search-input,
.status-filter {
	padding: 12px 16px;
	border-radius: var(--border-radius-sm);
	border: 1px solid var(--color-border);
	background: color-mix(
		in srgb,
		var(--color-contrast-light) 94%,
		var(--color-accent-gray) 6%
	);
	font-size: 0.95rem;
	color: var(--color-text-primary);
	transition: border-color var(--transition-default), box-shadow var(--transition-default);
}

.search-input:focus-visible,
.status-filter:focus-visible {
	outline: none;
	border-color: color-mix(
		in srgb,
		var(--color-logo-red) 65%,
		var(--color-contrast-dark) 35%
	);
	box-shadow: 0 0 0 3px
		color-mix(in srgb, var(--color-highlight) 30%, var(--color-transparent));
}

.search-input {
	flex: 1;
	min-width: 260px;
}

.status-filter {
	min-width: 200px;
}

.table-container {
	position: relative;
	border-radius: var(--border-radius-md);
	border: 1px solid var(--color-border);
	box-shadow: var(--shadow-soft);
	background: color-mix(
		in srgb,
		var(--color-surface) 90%,
		var(--color-glass) 10%
	);
	overflow: hidden;
}

.table-scroll {
	overflow-x: auto;
	overflow-y: visible;
	max-height: none;
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
	backdrop-filter: blur(4px);
	z-index: 2;
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

.mitglied-table {
	width: 100%;
	border-collapse: collapse;
	min-width: 1500px;
}

.mitglied-table thead {
	position: sticky;
	top: 0;
	background: color-mix(
		in srgb,
		var(--color-logo-red) 22%,
		var(--color-contrast-dark) 78%
	);
	color: var(--color-contrast-light);
}

.mitglied-table th {
	padding: 12px 14px;
	font-size: 0.8rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	text-align: left;
}

.column-head,
.column-cell {
	min-width: 120px;
}

.column-head.col-short,
.column-cell.col-short {
	min-width: 90px;
}

.column-head.col-date,
.column-cell.col-date {
	min-width: 110px;
}

.column-head.col-medium,
.column-cell.col-medium {
	min-width: 150px;
}

.column-head.col-email,
.column-cell.col-email {
	min-width: 260px;
}

.column-head.col-phone,
.column-cell.col-phone {
	min-width: 160px;
}

.column-head.col-street,
.column-cell.col-street {
	min-width: 220px;
}

.column-head.col-iban,
.column-cell.col-iban {
	min-width: 240px;
}

.column-head.col-bank,
.column-cell.col-bank {
	min-width: 200px;
}

.column-head.col-homepage,
.column-cell.col-homepage {
	min-width: 210px;
}

.column-head.col-sign,
.column-cell.col-sign {
	min-width: 220px;
}

.mitglied-table td {
	padding: 12px 14px;
	border-bottom: 1px solid var(--color-border);
	vertical-align: top;
	font-size: 0.95rem;
	color: var(--color-text-primary);
}

.status-cell {
	min-width: 160px;
}

.status-select {
	width: 100%;
	padding: 10px 12px;
	border-radius: var(--border-radius-sm);
	border: 1px solid var(--color-border);
	background: var(--color-contrast-light);
	font-size: 0.9rem;
	font-weight: var(--font-weight-medium);
}

.table-input {
	width: 100%;
	padding: 8px 10px;
	border-radius: var(--border-radius-sm);
	border: 1px solid transparent;
	background: transparent;
	font-size: 0.9rem;
	transition: border-color var(--transition-default), background var(--transition-default);
}

.table-input:focus {
	border-color: color-mix(
		in srgb,
		var(--color-logo-red) 60%,
		var(--color-contrast-dark) 40%
	);
	background: var(--color-contrast-light);
	outline: none;
	box-shadow: 0 0 0 2px
		color-mix(in srgb, var(--color-highlight) 25%, var(--color-transparent));
}

.table-input:hover {
	background: color-mix(
		in srgb,
		var(--color-highlight) 12%,
		var(--color-contrast-light) 88%
	);
}

.actions-cell {
	min-width: 80px;
	text-align: center;
}

.actions-head {
	text-align: center;
}

.delete-btn {
	background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
	color: var(--color-contrast-light);
	border: none;
	border-radius: var(--border-radius-sm);
	padding: 8px 12px;
	cursor: pointer;
	transition: transform var(--transition-default), box-shadow var(--transition-default);
}

.delete-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 2px 6px rgba(220, 53, 69, 0.4);
}

.empty {
	text-align: center;
	color: var(--color-text-secondary);
	padding: 24px;
}

.export-modal-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(17, 23, 35, 0.65);
	backdrop-filter: blur(6px);
	display: flex;
	align-items: flex-start;
	justify-content: center;
	z-index: 50;
	padding: 48px 24px 24px;
	overflow-y: auto;
}

.export-modal {
	width: min(480px, 100%);
	background: var(--color-surface);
	border-radius: var(--border-radius-md);
	box-shadow: var(--shadow-soft);
	border: 1px solid var(--color-border);
	display: flex;
	flex-direction: column;
	gap: 0;
}

.export-modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 18px 20px;
	border-bottom: 1px solid var(--color-border);
}

.export-modal-header h3 {
	margin: 0;
	font-size: 1.15rem;
}

.close-btn {
	border: none;
	background: transparent;
	color: var(--color-text-secondary);
	font-size: 1.2rem;
	cursor: pointer;
	transition: transform var(--transition-default), color var(--transition-default);
}

.close-btn:hover {
	color: var(--color-text-primary);
	transform: scale(1.05);
}

.export-modal-body {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 18px 20px;
	max-height: 60vh;
	overflow: auto;
}

.export-field {
	display: flex;
	flex-direction: column;
	gap: 8px;
	font-size: 0.9rem;
	color: var(--color-text-secondary);
}

.export-field input,
.export-field select {
	padding: 10px 14px;
	border-radius: var(--border-radius-sm);
	border: 1px solid var(--color-border);
	background: color-mix(
		in srgb,
		var(--color-contrast-light) 94%,
		var(--color-accent-gray) 6%
	);
	color: var(--color-text-primary);
	font-size: 0.95rem;
}

.export-field input:focus-visible,
.export-field select:focus-visible {
	outline: none;
	border-color: color-mix(
		in srgb,
		var(--color-logo-red) 55%,
		var(--color-contrast-dark) 45%
	);
	box-shadow: 0 0 0 3px
		color-mix(in srgb, var(--color-highlight) 25%, var(--color-transparent));
}

.export-columns {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.export-column-list {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
	gap: 10px;
}

.export-column-item {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 12px;
	border-radius: var(--border-radius-sm);
	border: 1px solid var(--color-border);
	background: color-mix(
		in srgb,
		var(--color-contrast-light) 94%,
		var(--color-accent-gray) 6%
	);
}

.export-modal-footer {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	padding: 16px 20px;
	border-top: 1px solid var(--color-border);
}

.cancel-btn,
.confirm-btn {
	padding: 10px 18px;
	border-radius: var(--border-radius-sm);
	border: none;
	cursor: pointer;
	font-weight: 600;
}

.cancel-btn {
	background: color-mix(
		in srgb,
		var(--color-contrast-light) 12%,
		var(--color-transparent) 88%
	);
	color: var(--color-text-secondary);
}

.confirm-btn {
	background: linear-gradient(135deg, #f5b317 0%, #f27f0c 100%);
	color: var(--color-contrast-dark);
}

.state-card {
	padding: 28px;
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
		var(--color-logo-red) 65%,
		var(--color-contrast-dark) 35%
	);
}

.state-card h3 {
	margin: 0;
	font-size: 1.3rem;
}

.mitglied-table tbody tr:nth-child(even) {
	background: color-mix(
		in srgb,
		var(--color-surface) 94%,
		var(--color-accent-gray) 6%
	);
}

.mitglied-table tbody tr:hover {
	background: color-mix(
		in srgb,
		var(--color-highlight) 14%,
		var(--color-surface) 86%
	);
}

.status-open {
	border-left: 4px solid color-mix(
		in srgb,
		var(--color-logo-red) 65%,
		var(--color-contrast-light) 35%
	);
}

.status-processing {
	border-left: 4px solid orange;
}

.status-archived {
	border-left: 4px solid color-mix(
		in srgb,
		var(--color-accent-gray) 70%,
		var(--color-contrast-dark) 30%
	);
	opacity: 0.85;
}

.status-new {
	border-left: 4px solid blue;
}



@media (max-width: 1200px) {
	.mitglied-table {
		min-width: 1300px;
	}
}

@media (max-width: 840px) {
	.header-section {
		flex-direction: column;
		align-items: stretch;
	}

	.stats-section {
		grid-auto-flow: row;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	}

	.header-actions {
		justify-content: center;
		flex-wrap: wrap;
	}

	.filter-row {
		flex-direction: column;
		align-items: stretch;
	}

	.search-input,
	.status-filter {
		min-width: 100%;
	}
}

@media (max-width: 600px) {
	.header-section {
		padding: 16px 14px;
	}

	.filter-section {
		padding: 18px;
	}
}
</style>

