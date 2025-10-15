<template>
  <div class="foev-container">
    <div class="header-section">
      <h2>FÖV Anträge Verwaltung</h2>
      <div class="header-actions">
        <button @click="refreshData" class="refresh-btn" :disabled="loading">
          {{ loading ? 'Lädt...' : 'Aktualisieren' }}
        </button>
        <button @click="exportToCSV" class="export-btn" :disabled="antraege.length === 0">
          CSV Export
        </button>
      </div>
    </div>

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
                @change="updateStatus(antrag.id, $event.target.value)"
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
                @blur="updateField(antrag.id, 'vorname', $event.target.value)"
                class="table-input"
              />
            </td>
            <td>
              <input 
                :value="antrag.nachname" 
                @blur="updateField(antrag.id, 'nachname', $event.target.value)"
                class="table-input"
              />
            </td>
            <td>
              <input 
                :value="antrag.email" 
                @blur="updateField(antrag.id, 'email', $event.target.value)"
                class="table-input"
                type="email"
              />
            </td>
            <td>
              <input 
                :value="antrag.telefon" 
                @blur="updateField(antrag.id, 'telefon', $event.target.value)"
                class="table-input"
              />
            </td>
            <td>{{ formatDate(antrag.geburtsdatum) }}</td>
            <td>
              <input 
                :value="antrag.strasse" 
                @blur="updateField(antrag.id, 'strasse', $event.target.value)"
                class="table-input"
              />
            </td>
            <td>
              <input 
                :value="antrag.plz" 
                @blur="updateField(antrag.id, 'plz', $event.target.value)"
                class="table-input"
              />
            </td>
            <td>
              <input 
                :value="antrag.ort" 
                @blur="updateField(antrag.id, 'ort', $event.target.value)"
                class="table-input"
              />
            </td>
            <td>
              <input 
                :value="antrag.land" 
                @blur="updateField(antrag.id, 'land', $event.target.value)"
                class="table-input"
              />
            </td>
            <td>
              <input 
                :value="antrag.iban" 
                @blur="updateField(antrag.id, 'iban', $event.target.value)"
                class="table-input"
              />
            </td>
            <td>
              <input 
                :value="antrag.konterinhaber" 
                @blur="updateField(antrag.id, 'konterinhaber', $event.target.value)"
                class="table-input"
              />
            </td>
            <td>
              <input 
                :value="antrag.bank" 
                @blur="updateField(antrag.id, 'bank', $event.target.value)"
                class="table-input"
              />
            </td>
            <td>{{ formatDate(antrag.beginn) }}</td>
            <td>
              <input 
                :value="antrag.betragZusatzEinmalig" 
                @blur="updateField(antrag.id, 'betragZusatzEinmalig', $event.target.value)"
                class="table-input"
                type="number"
                step="0.01"
              />
            </td>
            <td>
              <input 
                :value="antrag.betragZusatzJaehrlich" 
                @blur="updateField(antrag.id, 'betragZusatzJaehrlich', $event.target.value)"
                class="table-input"
                type="number"
                step="0.01"
              />
            </td>
            <td>
              <input 
                :value="antrag.big" 
                @blur="updateField(antrag.id, 'big', $event.target.value)"
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { db } from '../firebase.js'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'

// Reactive data
const antraege = ref([])
const loading = ref(false)
const searchTerm = ref('')
const statusFilter = ref('')

// Computed properties
const filteredAntraege = computed(() => {
  let filtered = antraege.value

  // Filter by search term
  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    filtered = filtered.filter(antrag => 
      antrag.vorname?.toLowerCase().includes(search) ||
      antrag.nachname?.toLowerCase().includes(search) ||
      antrag.email?.toLowerCase().includes(search) ||
      antrag.telefon?.toLowerCase().includes(search) ||
      antrag.ort?.toLowerCase().includes(search) ||
      antrag.strasse?.toLowerCase().includes(search)
    )
  }

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter(antrag => antrag.status === statusFilter.value)
  }

  return filtered
})

// Methods
const loadAntraege = async () => {
  loading.value = true
  try {
    const querySnapshot = await getDocs(collection(db, 'foevAntraege'))
    antraege.value = []
    querySnapshot.forEach((doc) => {
      antraege.value.push({
        id: doc.id,
        ...doc.data()
      })
    })
    // Sort by date (newest first)
    antraege.value.sort((a, b) => new Date(b.datum) - new Date(a.datum))
  } catch (error) {
    console.error('Fehler beim Laden der Anträge:', error)
    alert('Fehler beim Laden der Anträge')
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadAntraege()
}

const updateStatus = async (id, newStatus) => {
  try {
    await updateDoc(doc(db, 'foevAntraege', id), {
      status: newStatus
    })
    
    // Update local data
    const antrag = antraege.value.find(a => a.id === id)
    if (antrag) {
      antrag.status = newStatus
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Status:', error)
    alert('Fehler beim Aktualisieren des Status')
  }
}

const updateField = async (id, field, newValue) => {
  try {
    await updateDoc(doc(db, 'foevAntraege', id), {
      [field]: newValue
    })
    
    // Update local data
    const antrag = antraege.value.find(a => a.id === id)
    if (antrag) {
      antrag[field] = newValue
    }
  } catch (error) {
    console.error(`Fehler beim Aktualisieren von ${field}:`, error)
    alert(`Fehler beim Aktualisieren von ${field}`)
  }
}

const deleteAntrag = async (id) => {
  if (!confirm('Sind Sie sicher, dass Sie diesen Antrag löschen möchten?')) {
    return
  }
  
  try {
    await deleteDoc(doc(db, 'foevAntraege', id))
    antraege.value = antraege.value.filter(a => a.id !== id)
  } catch (error) {
    console.error('Fehler beim Löschen des Antrags:', error)
    alert('Fehler beim Löschen des Antrags')
  }
}

const exportToCSV = () => {
  const headers = [
    'Status', 'Datum', 'Vorname', 'Nachname', 'Email', 'Telefon', 'Geburtsdatum',
    'Straße', 'PLZ', 'Ort', 'Land', 'IBAN', 'Kontoinhaber', 'Bank', 'Beginn',
    'Zusatz Einmalig', 'Zusatz Jährlich', 'BIG', 'DSGVO', 'Unterschrift'
  ]
  
  const csvContent = [
    headers.join(','),
    ...filteredAntraege.value.map(antrag => [
      antrag.status || '',
      antrag.datum || '',
      antrag.vorname || '',
      antrag.nachname || '',
      antrag.email || '',
      antrag.telefon || '',
      antrag.geburtsdatum || '',
      antrag.strasse || '',
      antrag.plz || '',
      antrag.ort || '',
      antrag.land || '',
      antrag.iban || '',
      antrag.konterinhaber || '',
      antrag.bank || '',
      antrag.beginn || '',
      antrag.betragZusatzEinmalig || '',
      antrag.betragZusatzJaehrlich || '',
      antrag.big || '',
      antrag.dsgvo || '',
      antrag.unterschrift || ''
    ].map(field => `"${field}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `foev-antraege-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE')
}

const getStatusCount = (status) => {
  return antraege.value.filter(antrag => antrag.status === status).length
}

const getRowClass = (status) => {
  return `status-${status}`
}

// Lifecycle
onMounted(() => {
  loadAntraege()
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
  background: #ff2323;
  color: white;
  padding: 30px;
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header-section h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.header-actions {
  display: flex;
  gap: 15px;
}

.refresh-btn, .export-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.export-btn {
  background: #28a745;
  color: white;
  border: 2px solid #28a745;
}

.export-btn:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.refresh-btn:disabled, .export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
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
  display: flex;
  gap: 20px;
  padding: 25px 30px;
  background: white;
  margin: 0;
  border-bottom: 1px solid #e9ecef;
  flex-wrap: wrap;
}

.stat-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  min-width: 120px;
  flex: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #dee2e6;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-number {
  display: block;
  font-size: 32px;
  font-weight: 800;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #6c757d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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