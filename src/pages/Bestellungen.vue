<template>
    <div class="bestellungen-container-new">
        <h2>Bestellungen</h2>
        <div class="filter-tabs">
            <button v-for="tab in filterTabs" :key="tab.value" @click="activeFilter = tab.value" :class="['filter-tab', { active: activeFilter === tab.value }]">
                {{ tab.label }}
            </button>
        </div>
        <div v-if="filteredBestellungen.length === 0" class="keine-bestellungen-new">
            Keine Bestellungen vorhanden
        </div>
        <div class="bestellungen-list-new">
            <div v-for="bestellung in filteredBestellungen" :key="bestellung.id" class="bestellung-card" :class="'status-' + bestellung.status">
                <div class="card-header">
                    <div class="status-dropdown">
                        <select v-model="bestellung.status" @change="updateStatus(bestellung.id, bestellung.status)">
                            <option value="neu">Neu</option>
                            <option value="in_bearbeitung">In Bearbeitung</option>
                            <option value="abgeschlossen">Abgeschlossen</option>
                        </select>
                    </div>
                    <span class="bestell-id">#{{ bestellung.id }}</span>
                </div>
                <div class="card-details">
                    <div><strong>Kunde:</strong> {{ bestellung.name }}</div>
                    <div><strong>Email:</strong> {{ bestellung.email }}</div>
                    <div><strong>Team:</strong> {{ bestellung.team }}</div>
                    <div><strong>Datum:</strong> {{ formatDate(bestellung.createdAt.toDate()) }}</div>
                    <div><strong>Adresse:</strong> {{ bestellung.address }}</div>
                    <div><strong>Menge:</strong> {{ getTotalItems(bestellung) }}</div>
                    <div><strong>Preis:</strong> {{ formatPrice(bestellung.total) }}€</div>
                </div>
                <div class="card-items">
                    <h4>Artikel:</h4>
                    <div v-for="item in bestellung.items" :key="item.id" class="item-row-new">
                        <img v-if="item.image" :src="item.image" alt="Artikelbild" class="item-image-new" />
                        <div class="item-info-new">
                            <div><strong>{{ item.name }}</strong></div>
                            <div>Größe: {{ item.size }}</div>
                            <div>Menge: {{ item.quantity }}</div>
                            <div>Einzelpreis: {{ formatPrice(item.price) }}€</div>
                            <div v-if="item.customName">CustomName: {{ item.customName }}</div>
                            <div v-if="item.customNumber">CustomNumber: {{ item.customNumber }}</div>
                            <div v-if="item.customInitials">CustomInitials: {{ item.customInitials }}</div>
                            <div v-if="item.hasInitials" class="flag">🟢 hat Initialen</div>
                        </div>
                    </div>
                </div>
                <div class="card-actions">
                    <label class="custom-checkbox">
                        <input type="checkbox" :checked="bestellung.bezahlt" @change="toggleBezahlt(bestellung.id)" />
                        <span :class="['bezahlt-badge', bestellung.bezahlt ? 'bezahlt' : 'nicht-bezahlt']">
                            {{ bestellung.bezahlt ? 'Bezahlt' : 'Nicht bezahlt' }}
                        </span>
                    </label>
                    <button @click="downloadPDF(bestellung)" class="pdf-btn">PDF herunterladen</button>
                    <button @click="deleteBestellung(bestellung.id)" class="delete-btn-new">Löschen</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CryptoJS from 'crypto-js';
import jsPDF from 'jspdf';

const bestellungen = ref([]);
const encryptionKey = '3a94c345dbc715e7d7974f03fd86ee713cbb7668030dcd6431437f2ac032017c';

const decryptData = (encryptedData) => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Fehler beim Entschlüsseln:', error);
        return encryptedData;
    }
};

const loadBestellungen = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'bestellungen'));
        bestellungen.value = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                name: data.name ? decryptData(data.name) : '',
                team: data.team ? decryptData(data.team) : '',
                address: data.address ? decryptData(data.address) : '',
                email: data.email ? decryptData(data.email) : ''
            };
        });
    } catch (error) {
        console.error('Fehler beim Laden der Bestellungen:', error);
    }
};

const updateStatus = async (bestellungId, newStatus) => {
    try {
        const bestellungRef = doc(db, 'bestellungen', bestellungId);
        await updateDoc(bestellungRef, { status: newStatus });
        await loadBestellungen();
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Status:', error);
    }
};

const deleteBestellung = async (bestellungId) => {
    if (confirm('Möchten Sie diese Bestellung wirklich löschen?')) {
        try {
            await deleteDoc(doc(db, 'bestellungen', bestellungId));
            await loadBestellungen();
        } catch (error) {
            console.error('Fehler beim Löschen der Bestellung:', error);
        }
    }
};

const getTotalItems = (bestellung) => {
    return bestellung.items.reduce((total, item) => total + item.quantity, 0);
};

const toggleBezahlt = async (bestellungId) => {
    try {
        const bestellungRef = doc(db, 'bestellungen', bestellungId);
        const bestellung = bestellungen.value.find(b => b.id === bestellungId);
        const newBezahltStatus = !bestellung.bezahlt;
        await updateDoc(bestellungRef, { bezahlt: newBezahltStatus });
        await loadBestellungen();
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Bezahlstatus:', error);
    }
};

const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('de-DE');
};

const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
};

const filterTabs = [
    { label: 'Alle', value: 'alle' },
    { label: 'Neu', value: 'neu' },
    { label: 'In Bearbeitung', value: 'in_bearbeitung' },
    { label: 'Abgeschlossen', value: 'abgeschlossen' }
];
const activeFilter = ref('alle');
const filteredBestellungen = computed(() => {
    if (activeFilter.value === 'alle') return bestellungen.value;
    return bestellungen.value.filter(b => b.status === activeFilter.value);
});

function downloadPDF(bestellung) {
    const doc = new jsPDF();
    let y = 15;
    doc.setFontSize(18);
    doc.text('Bestellung', 10, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Bestellnummer: ${bestellung.id}`, 10, y);
    y += 8;
    doc.text(`Status: ${bestellung.status}`, 10, y);
    y += 8;
    doc.text(`Kunde: ${bestellung.name}`, 10, y);
    y += 8;
    doc.text(`Email: ${bestellung.email}`, 10, y);
    y += 8;
    doc.text(`Team: ${bestellung.team}`, 10, y);
    y += 8;
    doc.text(`Datum: ${formatDate(bestellung.createdAt.toDate())}`, 10, y);
    y += 8;
    doc.text(`Adresse: ${bestellung.address}`, 10, y);
    y += 8;
    doc.text(`Menge: ${getTotalItems(bestellung)}`, 10, y);
    y += 8;
    doc.text(`Preis: ${formatPrice(bestellung.total)} €`, 10, y);
    y += 12;
    doc.setFontSize(14);
    doc.text('Artikel:', 10, y);
    y += 8;
    doc.setFontSize(12);
    bestellung.items.forEach((item, idx) => {
        doc.text(`- ${item.name} (${item.size}), Menge: ${item.quantity}, Einzelpreis: ${formatPrice(item.price)} €`, 12, y);
        y += 7;
        if (item.customName) { doc.text(`  CustomName: ${item.customName}`, 16, y); y += 6; }
        if (item.customNumber) { doc.text(`  CustomNumber: ${item.customNumber}`, 16, y); y += 6; }
        if (item.customInitials) { doc.text(`  CustomInitials: ${item.customInitials}`, 16, y); y += 6; }
    });
    y += 6;
    doc.setFontSize(12);
    doc.text(`Bezahlt: ${bestellung.bezahlt ? 'Ja' : 'Nein'}`, 10, y);
    doc.save(`Bestellung_${bestellung.id}.pdf`);
}

onMounted(() => {
    loadBestellungen();
});
</script>

<style scoped>
.bestellungen-container-new {
    max-width: 900px;
    margin: 0 auto;
    padding: 30px 10px;
    background: #f7f7fa;
    border-radius: 20px;
    border: 4px solid #222;
}

h2 {
    text-align: center;
    margin-bottom: 30px;
    font-size: 2.2em;
    font-weight: 700;
}

.filter-tabs {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-bottom: 24px;
}
.filter-tab {
    padding: 8px 22px;
    border: none;
    border-radius: 8px;
    background: #e0e0e0;
    cursor: pointer;
    font-size: 1.08em;
    font-weight: 500;
    transition: background 0.2s, color 0.2s;
}
.filter-tab.active {
    background: #4caf50;
    color: #fff;
}

.keine-bestellungen-new {
    text-align: center;
    padding: 30px;
    background: #fff;
    border-radius: 12px;
    border: 2px solid #bbb;
    font-size: 1.2em;
    margin-bottom: 20px;
}

.bestellungen-list-new {
    display: flex;
    flex-direction: column;
    gap: 28px;
}

.bestellung-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.07);
    border: 2px solid #e0e0e0;
    padding: 22px 18px 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.status-dropdown select {
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid #bbb;
    font-size: 1em;
    background: #f5f5f5;
    font-weight: 500;
}

.bestell-id {
    font-size: 1.1em;
    color: #888;
    font-family: monospace;
}

.card-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 18px;
    font-size: 1.08em;
}

.card-items {
    margin-top: 8px;
    background: #f7f7f7;
    border-radius: 8px;
    padding: 10px;
}

.item-row-new {
    display: flex;
    align-items: center;
    gap: 15px;
    border-bottom: 1px solid #eee;
    padding: 8px 0;
}
.item-row-new:last-child {
    border-bottom: none;
}
.item-image-new {
    width: 50px;
    height: 50px;
    object-fit: contain;
    border-radius: 6px;
    background: #fff;
    border: 1px solid #ccc;
}
.item-info-new {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 0.98em;
}

.card-actions {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-top: 8px;
}
.custom-checkbox {
    display: flex;
    align-items: center;
    font-size: 1.08em;
    gap: 6px;
}
.custom-checkbox input[type="checkbox"] {
    width: 20px;
    height: 20px;
    accent-color: #7c3aed;
}
.delete-btn-new {
    padding: 8px 18px;
    border-radius: 10px;
    border: none;
    background: #ff5252;
    color: white;
    font-size: 1em;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
}
.delete-btn-new:hover {
    background: #d32f2f;
}
.flag {
    padding: 2px 8px;
    border-radius: 8px;
    background: #f3f3f3;
    font-size: 0.95em;
    margin-top: 2px;
}
.pdf-btn {
    padding: 8px 18px;
    border-radius: 10px;
    border: none;
    background: #1976d2;
    color: white;
    font-size: 1em;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
}
.pdf-btn:hover {
    background: #0d47a1;
}
@media (max-width: 700px) {
    .bestellungen-container-new {
        padding: 6px 0;
        border-width: 2px;
        max-width: 100vw;
    }
    h2 {
        font-size: 1.3em;
        margin-bottom: 18px;
    }
    .filter-tabs {
        gap: 4px;
        margin-bottom: 12px;
    }
    .filter-tab {
        padding: 6px 10px;
        font-size: 0.98em;
    }
    .keine-bestellungen-new {
        padding: 16px;
        font-size: 1em;
        margin-bottom: 10px;
    }
    .bestellungen-list-new {
        gap: 10px;
    }
    .bestellung-card {
        padding: 8px 2px 8px 2px;
        border-radius: 10px;
        gap: 7px;
    }
    .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        margin-bottom: 2px;
    }
    .status-dropdown select {
        font-size: 0.98em;
        padding: 4px 8px;
        border-radius: 6px;
    }
    .bestell-id {
        font-size: 0.98em;
    }
    .card-details {
        grid-template-columns: 1fr;
        gap: 4px 0;
        font-size: 0.98em;
    }
    .card-items {
        padding: 6px;
        font-size: 0.97em;
    }
    .item-row-new {
        gap: 8px;
        padding: 4px 0;
    }
    .item-image-new {
        width: 36px;
        height: 36px;
    }
    .item-info-new {
        font-size: 0.95em;
    }
    .card-actions {
        flex-direction: column;
        align-items: stretch;
        gap: 7px;
        margin-top: 4px;
    }
    .custom-checkbox {
        font-size: 0.98em;
        gap: 4px;
    }
    .pdf-btn, .delete-btn-new {
        width: 100%;
        font-size: 0.98em;
        padding: 7px 0;
    }
    .bezahlt-badge {
        font-size: 0.95em;
        padding: 2px 8px;
        margin-left: 4px;
    }
}
.bestellung-card.status-neu {
  background: #e3f2fd;
}
.bestellung-card.status-in_bearbeitung {
  background: #fffde7;
}
.bestellung-card.status-abgeschlossen {
  background: #e8f5e9;
}
.bezahlt-badge {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 0.98em;
  font-weight: 600;
  margin-left: 8px;
  color: #fff;
}
.bezahlt-badge.bezahlt {
  background: #43a047;
}
.bezahlt-badge.nicht-bezahlt {
  background: #ff9800;
}
</style> 