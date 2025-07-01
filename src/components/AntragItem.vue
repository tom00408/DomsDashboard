<template>
	<div :class="['container', status]">
		<div class="hstack">
			<div class="vstack">
				<div class="bold">
					<p>{{ antrag.vorname }} {{ antrag.nachname }}</p>
				</div>
				<p>{{ antrag.email }}</p>
                <p>{{ antrag.telefon }}</p>
				<p>{{ antrag.abteilung }}</p>
                <p>{{ antrag.kinderAngemeldet ?  `${antrag.kinderAngemeldet}👶` : '' }}{{ antrag.kinderAngemeldet && antrag.partnerAngemeldet ? '|' : '' }} {{ antrag.partnerAngemeldet ? '👩‍❤️‍👨' : '' }}    {{ antrag.gehörtZu ? antrag.gehörtZu : '' }}</p>
			</div>
			<div class="vline"></div>
			<div class="vstack">
				<p>
					<b> Geb: </b>
					{{ formatDate(antrag.geburtsdatum) }}
				</p>
				<p><b> PLZ: </b>{{ antrag.plz }}, {{ antrag.ort }}</p>
				<p>
					<b> Str: </b>
					{{ antrag.strasse }}
				</p>
			</div>
			<div class="hstack">
				<div class="vline"></div>
				<div class="vstack">
					<p><b> Beginn:</b> {{ formatDate(antrag.beginn) }}</p>
					<p><b> Zahlungsweise:</b> {{ antrag.zahlungsweise }}</p>

                    <div v-if="antrag.abweichenderNachname" class="hstack">
                        <div class="pack">
                            <p class="abweichende"><b> Abweichender Kontoinhaber!</b></p>
                            <p class="abweichende">{{ antrag.abweichenderVorname }} {{ antrag.abweichenderNachname }}</p>
                        </div>
                        <div class="pack">
                            <p class="abweichende">{{ antrag.abweichendeStrasse }}</p>
                            <p class="abweichende">{{ antrag.abweichendePlz }}, {{ antrag.abweichenderOrt }}</p>

                            
                        </div>
                    </div>

				</div>
                <div class="vline"></div>
				<div class="vstack">
					<p class="kleiner"><b> DSGVO:</b> {{ antrag.dsgvo ? "Ja" : "Nein"}}</p>
                    <p class="kleiner"><b> Homepage:</b> {{ antrag.homepage ? "Ja" : "Nein"}}</p>
                    <p class="kleiner"><b> Social Media:</b> {{ antrag.socialMedia ? "Ja" : "Nein" }}</p>
                    <p class="kleiner"><b> Presse:</b> {{ antrag.presse ? "Ja" : "Nein"}}</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
defineProps({
	antrag: Object,
	status: String,
});
function formatDate(input) {
	if (!input) return '';
	const [year, month, day] = input.split('-');
    return `${day}.${month}.${year}`;
}
</script>

<style scoped>
.container {
    margin: 0 auto;
    padding: 18px 10px;
    background: white;
    border-radius: 12px;
    box-sizing: border-box;
    width: 100%;
}

p {
    font-size: 20px;
    margin: 4px 0;
    word-break: break-word;
}
.kleiner {
    font-size: 16px;
}
.bold {
    font-weight: bold;
    font-size: 22px;
}
.abweichende {
    font-size: 15px;
}
.hstack {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    align-items: flex-start;
    justify-content: flex-start;
}
.vstack {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: flex-start;
}
.vline {
    border-left: 1.5px solid #888;
    height: 180px;
    margin: 0 18px;
    align-self: stretch;
}
.pack {
    margin-right: 12px;
}
@media (max-width: 900px) {
    .container {
        max-width: 98vw;
        padding: 8px 2vw;
    }
    .hstack {
        flex-direction: column;
        gap: 10px;
    }
    .vline {
        display: none;
    }
}
</style>
