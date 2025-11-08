<template>
	<div class="foev-container">
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
					<span class="stat-number">{{ getStatusCount('in_progress') }}</span>
					<span class="stat-label">In Bearbeitung</span>
				</div>
				<div class="stat-card">
					<span class="stat-number">{{ getStatusCount('approved') }}</span>
					<span class="stat-label">Genehmigt</span>
				</div>
				<div class="stat-card">
					<span class="stat-number">{{ getStatusCount('rejected') }}</span>
					<span class="stat-label">Abgelehnt</span>
				</div>
			</div>
			<div class="header-actions">
				<button @click="refreshData" class="refresh-btn" :disabled="loading">
					{{ loading ? 'Lädt…' : 'Aktualisieren' }}
				</button>
				<button @click="exportToCSV()" class="export-btn" :disabled="antraege.length === 0">
					CSV Export
				</button>
				<button
					@click="openAdvancedExport"
					class="export-btn"
					:disabled="antraege.length === 0"
				>
					Erweiterter CSV Export
				</button>
			</div>
		</header>
  
      <!-- Filter und Suche -->
      <div class="filter-section">
        <div class="filter-row">
          <input 
            v-model="searchTerm" 
            placeholder="Suchen (Name, Email, etc.)" 
            class="search-input"
          />
          <select v-model="statusFilter" class="status-filter">
            <option value="">Alle Status</option>
            <option value="new">Neu</option>
            <option value="in_progress">In Bearbeitung</option>
            <option value="approved">Genehmigt</option>
            <option value="rejected">Abgelehnt</option>
          </select>
        </div>
      </div>
  
      <!-- Statistiken -->
      
  
      <!-- Tabelle -->
      <div class="table-container">
        <table class="foev-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Datum</th>
              <th>Vorname</th>
              <th>Nachname</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Geburtsdatum</th>
              <th>Straße</th>
              <th>PLZ</th>
              <th>Ort</th>
              <th>Land</th>
              <th>IBAN</th>
              <th>Kontoinhaber</th>
              <th>Bank</th>
              <th>Beginn</th>
              <th>Zusatz Einmalig</th>
              <th>Zusatz Jährlich</th>
              <th>BIG</th>
              <th>DSGVO</th>
              <th>Unterschrift</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="antrag in filteredAntraege" :key="antrag.id" :class="getRowClass(antrag.status)">
              <td>
                <select
                  :value="antrag.status"
                  @change="onStatusChange(antrag.id, $event)"
                  class="status-select"
                >
                  <option value="new">Neu</option>
                  <option value="in_progress">In Bearbeitung</option>
                  <option value="approved">Genehmigt</option>
                  <option value="rejected">Abgelehnt</option>
                </select>
              </td>
              <td>{{ formatDate(antrag.datum) }}</td>
              <td>
                <input
                  :value="antrag.vorname"
                  @blur="onFieldBlur(antrag.id, 'vorname', $event)"
                  class="table-input"
                />
              </td>
              <td>
                <input
                  :value="antrag.nachname"
                  @blur="onFieldBlur(antrag.id, 'nachname', $event)"
                  class="table-input"
                />
              </td>
              <td>
                <input
                  :value="antrag.email"
                  @blur="onFieldBlur(antrag.id, 'email', $event)"
                  class="table-input"
                  type="email"
                />
              </td>
              <td>
                <input
                  :value="antrag.telefon"
                  @blur="onFieldBlur(antrag.id, 'telefon', $event)"
                  class="table-input"
                />
              </td>
              <td>{{ formatDate(antrag.geburtsdatum) }}</td>
              <td>
                <input
                  :value="antrag.strasse"
                  @blur="onFieldBlur(antrag.id, 'strasse', $event)"
                  class="table-input"
                />
              </td>
              <td>
                <input
                  :value="antrag.plz"
                  @blur="onFieldBlur(antrag.id, 'plz', $event)"
                  class="table-input"
                />
              </td>
              <td>
                <input
                  :value="antrag.ort"
                  @blur="onFieldBlur(antrag.id, 'ort', $event)"
                  class="table-input"
                />
              </td>
              <td>
                <input
                  :value="antrag.land"
                  @blur="onFieldBlur(antrag.id, 'land', $event)"
                  class="table-input"
                />
              </td>
              <td>
                <input
                  :value="antrag.iban"
                  @blur="onFieldBlur(antrag.id, 'iban', $event)"
                  class="table-input"
                />
              </td>
              <td>
                <input
                  :value="antrag.konterinhaber"
                  @blur="onFieldBlur(antrag.id, 'konterinhaber', $event)"
                  class="table-input"
                />
              </td>
              <td>
                <input
                  :value="antrag.bank"
                  @blur="onFieldBlur(antrag.id, 'bank', $event)"
                  class="table-input"
                />
              </td>
              <td>{{ formatDate(antrag.beginn) }}</td>
              <td>
                <input
                  :value="antrag.betragZusatzEinmalig"
                  @blur="onFieldBlur(antrag.id, 'betragZusatzEinmalig', $event)"
                  class="table-input"
                  type="number"
                  step="0.01"
                />
              </td>
              <td>
                <input
                  :value="antrag.betragZusatzJaehrlich"
                  @blur="onFieldBlur(antrag.id, 'betragZusatzJaehrlich', $event)"
                  class="table-input"
                  type="number"
                  step="0.01"
                />
              </td>
              <td>
                <input
                  :value="antrag.big"
                  @blur="onFieldBlur(antrag.id, 'big', $event)"
                  class="table-input"
                />
              </td>
              <td>{{ antrag.dsgvo }}</td>
              <td>{{ antrag.unterschrift }}</td>
              <td>
                <button @click="deleteAntrag(antrag.id)" class="delete-btn" title="Löschen">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Loading Overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>

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
                placeholder="foev-antraege-export.csv"
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
                  v-for="column in exportColumns"
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
import { computed, onMounted, ref } from 'vue'
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../service/firebase'

type AntragStatus = 'new' | 'in_progress' | 'approved' | 'rejected'

type EditableField =
  | 'vorname'
  | 'nachname'
  | 'email'
  | 'telefon'
  | 'strasse'
  | 'plz'
  | 'ort'
  | 'land'
  | 'iban'
  | 'konterinhaber'
  | 'bank'
  | 'betragZusatzEinmalig'
  | 'betragZusatzJaehrlich'
  | 'big'

interface FoevAntrag {
  id: string
  status: AntragStatus
  datum?: string
  vorname?: string
  nachname?: string
  email?: string
  telefon?: string
  geburtsdatum?: string
  strasse?: string
  plz?: string
  ort?: string
  land?: string
  iban?: string
  konterinhaber?: string
  bank?: string
  beginn?: string
  betragZusatzEinmalig?: string
  betragZusatzJaehrlich?: string
  big?: string
  dsgvo?: string
  unterschrift?: string
}

type ColumnKey = keyof FoevAntrag

interface ColumnDef {
  key: ColumnKey
  label: string
  editable?: boolean
  type?: 'text' | 'email' | 'number'
}

const exportColumns = [
  { key: 'status', label: 'Status' },
  { key: 'datum', label: 'Datum' },
  { key: 'vorname', label: 'Vorname', editable: true },
  { key: 'nachname', label: 'Nachname', editable: true },
  { key: 'email', label: 'Email', editable: true, type: 'email' },
  { key: 'telefon', label: 'Telefon', editable: true },
  { key: 'geburtsdatum', label: 'Geburtsdatum' },
  { key: 'strasse', label: 'Straße', editable: true },
  { key: 'plz', label: 'PLZ', editable: true },
  { key: 'ort', label: 'Ort', editable: true },
  { key: 'land', label: 'Land', editable: true },
  { key: 'iban', label: 'IBAN', editable: true },
  { key: 'konterinhaber', label: 'Kontoinhaber', editable: true },
  { key: 'bank', label: 'Bank', editable: true },
  { key: 'beginn', label: 'Beginn' },
  { key: 'betragZusatzEinmalig', label: 'Zusatz Einmalig', editable: true, type: 'number' },
  { key: 'betragZusatzJaehrlich', label: 'Zusatz Jährlich', editable: true, type: 'number' },
  { key: 'big', label: 'BIG', editable: true },
  { key: 'dsgvo', label: 'DSGVO' },
  { key: 'unterschrift', label: 'Unterschrift' },
] as const satisfies ReadonlyArray<ColumnDef>

const antraege = ref<FoevAntrag[]>([])
const loading = ref(false)
const searchTerm = ref('')
const statusFilter = ref<AntragStatus | ''>('')
const exportModalOpen = ref(false)
const selectedColumns = ref<string[]>([])
const exportFilename = ref('')
const exportDelimiter = ref(',')

const delimiterOptions = [
  { label: 'Komma (,)', value: ',' },
  { label: 'Semikolon (;)', value: ';' },
  { label: 'Tabulator (⇥)', value: '\t' },
]

const defaultExportDelimiter = ',' as const

const defaultExportFilename = () =>
  `foev-antraege-${new Date().toISOString().split('T')[0]}.csv`

const normalizedSearch = (value?: string) => value?.toLowerCase() ?? ''

const filteredAntraege = computed<FoevAntrag[]>(() => {
  let filtered = [...antraege.value]

  const search = searchTerm.value.trim().toLowerCase()
  if (search) {
    filtered = filtered.filter((antrag) =>
      [
        antrag.vorname,
        antrag.nachname,
        antrag.email,
        antrag.telefon,
        antrag.ort,
        antrag.strasse,
      ].some((field) => normalizedSearch(field).includes(search))
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter((antrag) => antrag.status === statusFilter.value)
  }

  return filtered
})

const parseDate = (value?: string) => {
  if (!value) return 0
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

const loadAntraege = async () => {
  loading.value = true
  try {
    const querySnapshot = await getDocs(collection(db, 'foevAntraege'))
    const entries: FoevAntrag[] = []

    querySnapshot.forEach((snapshot) => {
      const data = snapshot.data() as Omit<FoevAntrag, 'id'>
      entries.push({
        id: snapshot.id,
        ...data,
        status: (data.status ?? 'new') as AntragStatus,
      })
    })

    entries.sort((a, b) => parseDate(b.datum) - parseDate(a.datum))
    antraege.value = entries
  } catch (error) {
    console.error('Fehler beim Laden der Anträge:', error)
    alert('Fehler beim Laden der Anträge')
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  void loadAntraege()
}

const updateStatus = async (id: string, newStatus: AntragStatus) => {
  try {
    await updateDoc(doc(db, 'foevAntraege', id), {
      status: newStatus,
    })

    const antrag = antraege.value.find((item) => item.id === id)
    if (antrag) {
      antrag.status = newStatus
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Status:', error)
    alert('Fehler beim Aktualisieren des Status')
  }
}

const onStatusChange = (id: string, event: Event) => {
  const target = event.target as HTMLSelectElement | null
  if (!target) return
  updateStatus(id, target.value as AntragStatus)
}

const updateField = async (id: string, field: EditableField, newValue: string) => {
  try {
    await updateDoc(doc(db, 'foevAntraege', id), {
      [field]: newValue,
    })

    const antrag = antraege.value.find((item) => item.id === id)
    if (antrag) {
      antrag[field] = newValue
    }
  } catch (error) {
    console.error(`Fehler beim Aktualisieren von ${field}:`, error)
    alert(`Fehler beim Aktualisieren von ${field}`)
  }
}

const onFieldBlur = (id: string, field: EditableField, event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target) return
  updateField(id, field, target.value)
}

const deleteAntrag = async (id: string) => {
  if (!confirm('Sind Sie sicher, dass Sie diesen Antrag löschen möchten?')) {
    return
  }

  try {
    await deleteDoc(doc(db, 'foevAntraege', id))
    antraege.value = antraege.value.filter((item) => item.id !== id)
  } catch (error) {
    console.error('Fehler beim Löschen des Antrags:', error)
    alert('Fehler beim Löschen des Antrags')
  }
}

const escapeForCsv = (value: string) => `"${value.replace(/"/g, '""')}"`

const exportToCSV = (
  columns: ReadonlyArray<ColumnDef> = exportColumns,
  filename: string = defaultExportFilename(),
  delimiter: string = defaultExportDelimiter
) => {
  const headers = columns.map(column => column.label).join(delimiter)

  const rows = filteredAntraege.value
    .map(antrag =>
      columns
        .map(column => escapeForCsv(String(antrag[column.key] ?? '')))
        .join(delimiter)
    )
    .join('\n')

  const csvContent = [headers, rows].filter(Boolean).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('de-DE')
}

const getStatusCount = (status: AntragStatus) =>
  antraege.value.filter((antrag) => antrag.status === status).length

const getRowClass = (status: AntragStatus) => `status-${status}`

const openAdvancedExport = () => {
  selectedColumns.value = exportColumns.map((column) => String(column.key))
  exportFilename.value = defaultExportFilename()
  exportDelimiter.value = defaultExportDelimiter
  exportModalOpen.value = true
}

const confirmAdvancedExport = () => {
  if (!selectedColumns.value.length) {
    alert('Bitte mindestens eine Spalte auswählen.')
    return
  }

  const columns = exportColumns.filter((column) =>
    selectedColumns.value.includes(String(column.key))
  )

  const filename = exportFilename.value.trim() || defaultExportFilename()
  exportToCSV(columns, filename, exportDelimiter.value)
  exportModalOpen.value = false
}

const cancelAdvancedExport = () => {
  exportModalOpen.value = false
}

onMounted(() => {
  void loadAntraege()
})
  </script>
  
  <style scoped>
  .foev-container {
    padding: 0;
    margin: 0;
    background-color: #f5f5f5;
    min-height: 100vh;
    width: 100%;
  }
  
.header-section {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
	align-items: stretch;
	justify-content: space-between;
	margin-bottom: 20px;
	background: linear-gradient(135deg, #7b1220 0%, #ad1e28 100%);
	padding: 18px 22px;
	border-radius: var(--border-radius-md);
	box-shadow: var(--shadow-soft);
	color: var(--color-contrast-light);
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
		var(--color-contrast-light) 15%,
		var(--color-transparent) 85%
	);
	color: var(--color-contrast-light);
	border: 1px solid
		color-mix(in srgb, var(--color-contrast-light) 35%, var(--color-transparent) 65%);
}

.refresh-btn:hover:not(:disabled),
.export-btn:hover:not(:disabled) {
	transform: translateY(-2px);
	box-shadow: var(--shadow-soft);
}

.export-btn {
	background: linear-gradient(135deg, #f5b317 0%, #f27f0c 100%);
	color: var(--color-contrast-dark);
	border: 1px solid color-mix(
		in srgb,
		var(--color-contrast-dark) 20%,
		var(--color-contrast-light) 80%
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

.refresh-btn:disabled,
.export-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
	transform: none;
	box-shadow: none;
}

.filter-section {
    padding: 25px 30px;
    background: white;
    margin: 0;
    border-bottom: 1px solid #e9ecef;
  }
  
  .filter-row {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .search-input, .status-filter {
    padding: 12px 16px;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
    background: white;
  }
  
  .search-input:focus, .status-filter:focus {
    border-color: #667eea;
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  .search-input {
    flex: 1;
    min-width: 300px;
  }
  
  .status-filter {
    min-width: 180px;
  }
  
.stats-section {
	display: grid;
	grid-auto-flow: column;
	grid-auto-columns: minmax(110px, 1fr);
	gap: 12px;
	align-items: stretch;
}

.stat-card {
	display: flex;
	flex-direction: row;
    align-items: center;
	gap: 4px;
	padding: 14px 16px;
	border-radius: var(--border-radius-sm);
	border: 1px solid color-mix(
		in srgb,
		var(--color-border) 80%,
		var(--color-contrast-light) 20%
	);
	background: color-mix(
		in srgb,
		var(--color-surface) 85%,
		var(--color-glass) 15%
	);
	box-shadow: var(--shadow-soft);
	color: var(--color-text-primary);
	min-width: 0;
}

.stat-number {
	font-size: 1.35rem;
	font-weight: var(--font-weight-semibold);
	line-height: 1.2;
}

.stat-label {
	font-size: 0.85rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--color-text-secondary);
}
  
  .table-container {
    margin: 0;
    background: white;
    overflow-x: auto;
    border-radius: 0;
    box-shadow: none;
  }
  
  .foev-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1800px;
    font-size: 13px;
  }
  
  .foev-table th {
    background: linear-gradient(135deg, #495057 0%, #343a40 100%);
    color: white;
    padding: 15px 12px;
    text-align: left;
    font-weight: 700;
    border: none;
    position: sticky;
    top: 0;
    z-index: 100;
    white-space: nowrap;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .foev-table td {
    padding: 12px;
    border-bottom: 1px solid #e9ecef;
    vertical-align: middle;
    background: white;
  }
  
  .foev-table tbody tr:nth-child(even) {
    background-color: #f8f9fa;
  }
  
  .foev-table tbody tr:hover {
    background-color: #e3f2fd !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .status-new {
    background-color: #fff3cd !important;
    border-left: 4px solid #ffc107;
  }
  
  .status-in_progress {
    background-color: #d1ecf1 !important;
    border-left: 4px solid #17a2b8;
  }
  
  .status-approved {
    background-color: #d4edda !important;
    border-left: 4px solid #28a745;
  }
  
  .status-rejected {
    background-color: #f8d7da !important;
    border-left: 4px solid #dc3545;
  }
  
  .table-input {
    width: 100%;
    padding: 8px 10px;
    border: 2px solid transparent;
    border-radius: 6px;
    background: transparent;
    font-size: 13px;
    min-width: 100px;
    transition: all 0.2s ease;
  }
  
  .table-input:focus {
    border-color: #667eea;
    background: white;
    outline: none;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }
  
  .table-input:hover {
    background: rgba(102, 126, 234, 0.05);
  }
  
  .status-select {
    padding: 8px 12px;
    border: 2px solid #dee2e6;
    border-radius: 6px;
    font-size: 12px;
    background: white;
    min-width: 130px;
    font-weight: 600;
    transition: all 0.2s ease;
  }
  
  .status-select:focus {
    border-color: #667eea;
    outline: none;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }
  
  .delete-btn {
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    color: white;
    border: none;
    cursor: pointer;
    font-size: 14px;
    padding: 8px 12px;
    border-radius: 6px;
    transition: all 0.2s ease;
    font-weight: 600;
  }
  
  .delete-btn:hover {
    background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
  }

  .export-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(17, 23, 35, 0.65);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    z-index: 1000;
    padding: 48px 24px 24px;
    overflow-y: auto;
  }

  .export-modal {
    width: min(480px, 100%);
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0 18px 44px -18px rgba(17, 23, 35, 0.35);
    border: 1px solid rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
  }

  .export-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 22px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .export-modal-header h3 {
    margin: 0;
    font-size: 1.1rem;
  }

  .close-btn {
    border: none;
    background: transparent;
    color: #6c757d;
    font-size: 1.2rem;
    cursor: pointer;
    transition: transform 0.2s ease, color 0.2s ease;
  }

  .close-btn:hover {
    color: #343a40;
    transform: scale(1.05);
  }

  .export-modal-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 18px 22px;
    max-height: 60vh;
    overflow: auto;
  }

  .export-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 0.9rem;
    color: #495057;
  }

  .export-field input,
  .export-field select {
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: rgba(248, 249, 250, 0.8);
    font-size: 0.95rem;
    color: #212529;
  }

  .export-field input:focus-visible,
  .export-field select:focus-visible {
    outline: none;
    border-color: #f27f0c;
    box-shadow: 0 0 0 3px rgba(242, 127, 12, 0.25);
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
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: rgba(248, 249, 250, 0.9);
  }

  .export-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 22px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }

  .cancel-btn,
  .confirm-btn {
    padding: 10px 18px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 600;
  }

  .cancel-btn {
    background: rgba(248, 249, 250, 0.9);
    color: #6c757d;
  }

  .confirm-btn {
    background: linear-gradient(135deg, #f5b317 0%, #f27f0c 100%);
    color: var(--color-contrast-dark);
  }
  
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }
  
  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Responsive Design */
  @media (max-width: 1200px) {
    .foev-table {
      min-width: 1400px;
    }
    
    .header-section {
      padding: 20px;
    }
    
    .filter-section, .stats-section {
      padding: 20px;
    }
  }
  
  @media (max-width: 768px) {
    .header-section {
      flex-direction: column;
      align-items: stretch;
      padding: 20px 15px;
    }
    
    .header-section h2 {
      font-size: 24px;
      text-align: center;
      margin-bottom: 15px;
    }
    
    .header-actions {
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .filter-section, .stats-section {
      padding: 15px;
    }
    
    .filter-row {
      flex-direction: column;
      align-items: stretch;
    }
    
    .search-input {
      min-width: auto;
    }
    
    .stats-section {
      justify-content: center;
    }
    
    .stat-card {
      min-width: 100px;
    }
    
    .foev-table {
      min-width: 1200px;
    }
    
    .foev-table th,
    .foev-table td {
      padding: 8px 6px;
      font-size: 11px;
    }
    
    .table-input {
      min-width: 80px;
      font-size: 11px;
      padding: 6px 8px;
    }
    
    .status-select {
      min-width: 100px;
      font-size: 11px;
      padding: 6px 8px;
    }
  }
  
  @media (max-width: 480px) {
    .header-section {
      padding: 15px 10px;
    }
    
    .filter-section, .stats-section {
      padding: 10px;
    }
    
    .refresh-btn, .export-btn {
      padding: 10px 16px;
      font-size: 12px;
    }
    
    .stat-card {
      padding: 15px 10px;
    }
    
    .stat-number {
      font-size: 24px;
    }
  }
  </style>