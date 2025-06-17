<template>
	<div :class="['table-bg'
	]">
		<div :class="['tabelle-container', status]">
			<div class="hstack">
				<h2>{{ getTitle(status) || 'Kein Titel' }}</h2>
				<h4></h4>
				<!-- CSV Export Button -->
				<button v-if="status === 'selected'" @click="exportCSV">
					📥 CSV Exportieren
				</button>
			</div>

			<div :class="['antrage-container', status]">
				<div v-for="antrag in antraege" :key="antrag.id">
					<div class="Antrag">
						<AntragItem :antrag="antrag" :status="status" />
						<div class="vstack knopfe">
							<h3>{{ formatDate(antrag.datum) }}</h3>
							<button
								v-if="status !== 'selected'"
								@click="updateStatus(antrag.id, 'selected')">
								auswählen✅
							</button>
							<button
								v-if="status !== 'new'"
								@click="updateStatus(antrag.id, 'new')">
								zu neu➡️
							</button>
							<button
								v-if="status !== 'archived'"
								@click="updateStatus(antrag.id, 'archived')">
								archivieren📂
							</button>
						</div>
					</div>
				</div>
				<h3 v-if="antraege.length === 0">Keine Anträge</h3>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue';
import { useCollection } from 'vuefire';
import { collection, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import AntragItem from './AntragItem.vue';
import CryptoJS from 'crypto-js';

const props = defineProps({
	status: String,
});

const geheimschlüssel = 'MTV_Geismar';

// 🔐 Einzelne Anträge entschlüsseln
function entschlüsseln(antrag) {
	let data = {};
	for (let key in antrag) {
		if (key === 'id' || typeof antrag[key] !== 'string') {
			data[key] = antrag[key];
			continue;
		}
		try {
			const bytes = CryptoJS.AES.decrypt(antrag[key], geheimschlüssel);
			const decrypted = bytes.toString(CryptoJS.enc.Utf8);
			data[key] = decrypted || antrag[key];
		} catch (err) {
			data[key] = antrag[key];
		}
	}
	return data;
}

// 🔍 Firestore-Abfrage je nach Status (reaktiv)
const antraegeRef = collection(db, 'mitgliedsantraege');

const antragQuery = computed(() => {
	if (props.status === 'rest') {
		return query(
			antraegeRef,
			where('status', 'not-in', ['new', 'selected', 'archived'])
		);
	} else {
		return query(antraegeRef, where('status', '==', props.status));
	}
});

// 🔄 Reaktive Firestore-Daten holen
const { data: crypetdAntraege } = useCollection(antragQuery);

// 🔓 Entschlüsselte Anträge als Computed Property
const antraege = computed(() => {
	return crypetdAntraege.value
		? crypetdAntraege.value.map(antrag => ({
				id: antrag.id,
				...entschlüsseln(antrag),
		  }))
		: [];
});

/*
HILFSFUNKTIONEN
*/

function formatDate(input) {
	if (!input) return '';
	const [year, month, day] = input.split('-');
	return `${day}.${month}.${year}`;
}

const getTitle = (t) => ({
	new: 'Neue Anträge',
	selected: 'Ausgewählte Anträge',
	archived: 'Archivierte Anträge',
}[t] || 'Anträge ohne Status');

const updateStatus = async (antragId, newStatus) => {
	try {
		const antragRef = doc(db, 'mitgliedsantraege', antragId);
		await updateDoc(antragRef, { status: newStatus });
		console.log(`✅ Antrag ${antragId} wurde auf ${newStatus} gesetzt`);
		// Kein reload nötig, weil useCollection + computed = automatisch aktuell!
	} catch (error) {
		console.error('❌ Fehler beim Aktualisieren des Status:', error);
	}
};

const exportCSV = () => {
	if (antraege.value.length === 0) {
		alert('⚠ Keine Daten zum Exportieren!');
		return;
	}

	let csvContent = 'data:text/csv;charset=utf-8,';
	csvContent +=
		'UID;Anrede;Vorname;Nachname;Straße;PLZ;Ort;Land;Geburtsdatum;Geschlecht;E-Mail;Telefon;Vereinseintritt am;Status(Verein);Abteilung;IBAN;Zahlungsweise;GehörtZu;\n';

	antraege.value.forEach((antrag) => {
		const row = [
			'',
			antrag.anrede,
			antrag.vorname,
			antrag.nachname,
			antrag.strasse,
			antrag.plz,
			antrag.ort,
			antrag.land,
			antrag.geburtsdatum,
			antrag.anrede === 'Herr'
				? 'männlich'
				: antrag.anrede === 'Frau'
				? 'weiblich'
				: '',
			antrag.email,
			antrag.telefon,
			antrag.beginn,
			'aktiv',
			antrag.abteilung,
			antrag.iban,
			antrag.zahlungsweise,
			antrag.gehörtZu,
			
		].join(';');
		csvContent += row + '\n';
	});

	const encodedUri = encodeURI(csvContent);
	const link = document.createElement('a');
	link.setAttribute('href', encodedUri);
	link.setAttribute('download', `antraege_${props.status}.csv`);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};
</script>


<style scoped>

.tabelle-container {
	border: 4px solid black;
	padding: 24px;
	border-radius: 20px;
	margin: 32px auto;
	box-sizing: border-box;
	transition: background 0.2s;
}
.tabelle-container.selected {
	background-color: yellow;
}
.tabelle-container.new {
	background-color: blue; /* hellblau */
}
.tabelle-container.archived {
	background-color: #f5f5f5; /* hellgrau */
}
.tabelle-container.rest {
	background-color: #fff8e1; /* hellorange */
}
.antrage-container {
	display: flex;
	flex-direction: column;
	gap: 2.5rem;
}
.Antrag {
	border: 2px solid black;
	background-color: white;
	padding: 20px 24px;
	border-radius: 10px;
	display: flex;
	flex-direction: row;
	gap: 0.7rem;
}
button {
	padding: 14px 28px;
	border-radius: 20px;
	background-color: lightblue;
	font-size: 1.1rem;
	border: none;
	cursor: pointer;
	white-space: nowrap;
	transition: background 0.2s, transform 0.2s;
}
button:hover {
	transform: scale(1.17);
	background-color: blanchedalmond;
}
.knopfe {
	min-width: 180px;
}
h3 {
	font-size: 1.1rem;
	font-weight: 500;
	padding: 10px;
	border: 1px solid black;
	border-radius: 10px;
	margin: 0;
}
.hstack {
	display: flex;
	align-items: flex-start;
	gap: 1.5rem;
	flex-wrap: wrap;
	justify-content: center;
}
@media (max-width: 900px) {
	.Antrag {
		flex-direction: column;
	}
}
</style>