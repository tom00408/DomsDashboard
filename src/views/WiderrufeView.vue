<template>
    <div class="widerrufe-container">
        <h2>Widerrufe</h2>

        <div class="search-container">
            <input
                v-model="searchQuery"
                type="text"
                placeholder="Nach Namen oder Bestellnummer suchen..."
                class="search-input"
            />
        </div>

        <div class="filter-tabs">
            <button
                v-for="tab in filterTabs"
                :key="tab.value"
                @click="activeFilter = tab.value"
                :class="['filter-tab', { active: activeFilter === tab.value }]"
            >
                {{ tab.label }}
            </button>
        </div>

        <div v-if="filteredWiderrufe.length === 0" class="keine-widerrufe">
            {{ searchQuery ? 'Keine Widerrufe gefunden' : 'Keine Widerrufe vorhanden' }}
        </div>

        <div class="widerrufe-list">
            <div
                v-for="widerruf in filteredWiderrufe"
                :key="widerruf.id"
                class="widerruf-card"
                :class="'status-' + widerruf.status"
            >
                <div class="card-header">
                    <div class="status-dropdown">
                        <select v-model="widerruf.status" @change="updateStatus(widerruf.id, widerruf.status)">
                            <option v-for="s in widerrufStatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                        </select>
                    </div>
                    <span class="bestell-id">#{{ widerruf.bestellnummer }}</span>
                </div>
                <div class="card-details">
                    <div><strong>Name:</strong> {{ widerruf.name }}</div>
                    <div><strong>E-Mail:</strong> {{ widerruf.email }}</div>
                    <div><strong>Bestellnummer:</strong> {{ widerruf.bestellnummer }}</div>
                    <div><strong>Eingegangen:</strong> {{ formatDateTime(widerruf.eingangAt) }}</div>
                </div>
                <div v-if="widerruf.grund" class="card-grund">
                    <strong>Grund:</strong> {{ widerruf.grund }}
                </div>
                <div class="card-actions">
                    <button
                        type="button"
                        class="email-btn"
                        :disabled="!widerruf.email || emailSending === widerruf.id"
                        :title="widerruf.email ? 'Eingangsbestätigung erneut senden' : 'Keine E-Mail-Adresse'"
                        @click="resendEingangsbestaetigung(widerruf)"
                    >
                        {{ emailSending === widerruf.id ? '…' : 'Eingangsbestätigung senden' }}
                    </button>
                    <button @click="deleteWiderruf(widerruf.id)" class="delete-btn">Löschen</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../service/firebase';

const shopWiderrufEmailFn = httpsCallable(functions, 'shopWiderrufEmail');

const widerrufe = ref([]);
const emailSending = ref(null);

const widerrufStatuses = [
    { value: 'neu', label: 'Neu' },
    { value: 'in_bearbeitung', label: 'In Bearbeitung' },
    { value: 'erledigt', label: 'Erledigt' },
];

const loadWiderrufe = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'widerrufe'));
        widerrufe.value = querySnapshot.docs
            .map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    status: data.status || 'neu',
                    name: data.name || '',
                    bestellnummer: data.bestellnummer || '',
                    email: data.email || '',
                    grund: data.grund || '',
                };
            })
            .sort((a, b) => (toMillis(b.eingangAt) - toMillis(a.eingangAt)));
    } catch (error) {
        console.error('Fehler beim Laden der Widerrufe:', error);
    }
};

const toMillis = (ts) => {
    if (!ts) return 0;
    if (typeof ts.toDate === 'function') return ts.toDate().getTime();
    return new Date(ts).getTime();
};

const updateStatus = async (widerrufId, newStatus) => {
    try {
        await updateDoc(doc(db, 'widerrufe', widerrufId), { status: newStatus });
        await loadWiderrufe();
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Status:', error);
    }
};

const deleteWiderruf = async (widerrufId) => {
    if (confirm('Möchten Sie diesen Widerruf wirklich löschen?')) {
        try {
            await deleteDoc(doc(db, 'widerrufe', widerrufId));
            await loadWiderrufe();
        } catch (error) {
            console.error('Fehler beim Löschen des Widerrufs:', error);
        }
    }
};

const resendEingangsbestaetigung = async (widerruf) => {
    if (!widerruf?.email?.trim()) {
        alert('Keine E-Mail-Adresse für diesen Widerruf.');
        return;
    }
    emailSending.value = widerruf.id;
    try {
        const result = await shopWiderrufEmailFn({
            to: widerruf.email.trim(),
            name: widerruf.name || 'Kunde',
            bestellnummer: widerruf.bestellnummer || '',
            grund: widerruf.grund || '',
            eingangAt: widerruf.eingangAt && typeof widerruf.eingangAt.toDate === 'function'
                ? widerruf.eingangAt.toDate().toISOString()
                : new Date().toISOString(),
        });
        const data = result.data;
        if (data?.info) alert(data.info);
    } catch (error) {
        console.error('Eingangsbestätigung fehlgeschlagen:', error);
        alert(error?.message || 'E-Mail konnte nicht gesendet werden.');
    } finally {
        emailSending.value = null;
    }
};

const formatDateTime = (ts) => {
    if (!ts) return '';
    const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
    return date.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
};

const activeFilter = ref('alle');
const searchQuery = ref('');

const filterTabs = computed(() => [
    { label: 'Alle', value: 'alle' },
    ...widerrufStatuses.map(s => ({ label: s.label, value: s.value })),
]);

const filteredWiderrufe = computed(() => {
    let filtered = widerrufe.value;

    if (activeFilter.value !== 'alle') {
        filtered = filtered.filter(w => w.status === activeFilter.value);
    }

    if (searchQuery.value) {
        const searchLower = searchQuery.value.toLowerCase();
        filtered = filtered.filter(w =>
            (w.name || '').toLowerCase().includes(searchLower) ||
            (w.bestellnummer || '').toLowerCase().includes(searchLower)
        );
    }

    return filtered;
});

onMounted(() => {
    loadWiderrufe();
});
</script>

<style scoped>
.widerrufe-container {
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

.search-container {
    margin-bottom: 24px;
    text-align: center;
}
.search-input {
    padding: 10px 15px;
    border: 2px solid #ddd;
    border-radius: 10px;
    width: 80%;
    max-width: 400px;
    font-size: 1em;
    outline: none;
    transition: border-color 0.2s;
}
.search-input:focus {
    border-color: #4caf50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.filter-tabs {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
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

.keine-widerrufe {
    text-align: center;
    padding: 30px;
    background: #fff;
    border-radius: 12px;
    border: 2px solid #bbb;
    font-size: 1.2em;
    margin-bottom: 20px;
}

.widerrufe-list {
    display: flex;
    flex-direction: column;
    gap: 28px;
}

.widerruf-card {
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

.card-grund {
    background: #f7f7f7;
    border-radius: 8px;
    padding: 10px;
    font-size: 1.02em;
}

.card-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
}

.email-btn {
    padding: 8px 14px;
    border-radius: 10px;
    border: none;
    color: white;
    font-size: 0.95em;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
    background: #2e7d32;
}
.email-btn:hover:not(:disabled) {
    background: #1b5e20;
}
.email-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.delete-btn {
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
.delete-btn:hover {
    background: #d32f2f;
}

.widerruf-card.status-neu {
    background: #e3f2fd;
}
.widerruf-card.status-in_bearbeitung {
    background: #fffde7;
}
.widerruf-card.status-erledigt {
    background: #e8f5e9;
}

@media (max-width: 700px) {
    .widerrufe-container {
        padding: 6px 0;
        border-width: 2px;
        max-width: 100vw;
    }
    h2 {
        font-size: 1.3em;
        margin-bottom: 18px;
    }
    .search-input {
        width: 90%;
        padding: 8px 12px;
        font-size: 0.98em;
    }
    .filter-tabs {
        gap: 4px;
        margin-bottom: 12px;
    }
    .filter-tab {
        padding: 6px 10px;
        font-size: 0.98em;
    }
    .widerrufe-list {
        gap: 10px;
    }
    .widerruf-card {
        padding: 10px 6px;
        border-radius: 10px;
        gap: 7px;
    }
    .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
    }
    .card-details {
        grid-template-columns: 1fr;
        gap: 4px 0;
        font-size: 0.98em;
    }
    .card-actions {
        flex-direction: column;
        align-items: stretch;
        gap: 7px;
    }
    .email-btn, .delete-btn {
        width: 100%;
        font-size: 0.98em;
        padding: 7px 0;
    }
}
</style>
