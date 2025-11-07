<template>
	<section class="view">
		<header class="view-header">
			<div>
				<h2>Bestellungen</h2>
				<p>
					Alle Team- und Vereinsbestellungen im Blick: Status verfolgen, Lieferungen
					priorisieren, Kommunikation bündeln.
				</p>
			</div>
			<div class="view-actions">
				<button type="button" class="ghost-action">Bericht exportieren</button>
				<button type="button" class="view-action">Neue Bestellung</button>
			</div>
		</header>
		<div class="timeline">
			<div class="timeline-item">
				<span class="dot" />
				<div>
					<h3>Neue Bestellung eingegangen</h3>
					<p>Trikots Satz A · Eingang 08:32 Uhr · Priorität Hoch</p>
				</div>
			</div>
			<div class="timeline-item">
				<span class="dot" />
				<div>
					<h3>Lieferung vorbereitet</h3>
					<p>Trainingsjacken für Jugendteams · Übergabe an Logistik 10:05 Uhr</p>
				</div>
			</div>
			<div class="timeline-item muted">
				<span class="dot" />
				<div>
					<h3>Rückfrage offen</h3>
					<p>Bezahlung Turnierbedarf · Antworten bis 12:00 Uhr erwartet</p>
				</div>
			</div>
		</div>
		<div class="data-panel">
			<header>
				<h3>Statusübersicht</h3>
				<p>Aktualisiert vor 5 Minuten</p>
			</header>
			<div class="bar-chart">
				<div class="bar">
					<span>In Bearbeitung</span>
					<div class="bar-track">
						<div class="bar-fill in-progress" style="width: 55%" />
					</div>
				</div>
				<div class="bar">
					<span>Ausgeliefert</span>
					<div class="bar-track">
						<div class="bar-fill delivered" style="width: 72%" />
					</div>
				</div>
				<div class="bar">
					<span>Wartend</span>
					<div class="bar-track">
						<div class="bar-fill pending" style="width: 34%" />
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts"></script>

<style scoped>
.view {
	display: flex;
	flex-direction: column;
	gap: 28px;
	padding: 32px;
	background: var(--color-surface-elevated);
	border-radius: var(--border-radius-md);
	border: 1px solid var(--color-border);
	box-shadow: var(--shadow-soft);
	color: var(--color-text-primary);
}

.view-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 28px;
}

.view-header h2 {
	margin: 0 0 12px;
	font-size: 1.75rem;
	font-weight: var(--font-weight-semibold);
}

.view-header p {
	margin: 0;
	color: var(--color-text-secondary);
	max-width: 58ch;
	line-height: 1.6;
}

.view-actions {
	display: flex;
	gap: 12px;
}

.view-action,
.ghost-action {
	border-radius: var(--border-radius-sm);
	padding: 12px 18px;
	font-weight: var(--font-weight-medium);
	cursor: pointer;
	transition: transform var(--transition-default),
		box-shadow var(--transition-default), background var(--transition-default),
		color var(--transition-default), border-color var(--transition-default);
	box-shadow: var(--shadow-soft);
}

.view-action {
	border: none;
	background: color-mix(
		in srgb,
		var(--color-logo-red) 70%,
		var(--color-dark-red) 30%
	);
	color: var(--color-contrast-light);
}

.view-action:hover,
.view-action:focus-visible {
	transform: translateY(-2px);
	background: color-mix(
		in srgb,
		var(--color-logo-red) 55%,
		var(--color-contrast-dark) 45%
	);
	outline: none;
}

.ghost-action {
	background: color-mix(
		in srgb,
		var(--color-glass) 80%,
		var(--color-surface) 20%
	);
	border: 1px solid var(--color-border);
	color: var(--color-text-primary);
}

.ghost-action:hover,
.ghost-action:focus-visible {
	transform: translateY(-2px);
	background: color-mix(
		in srgb,
		var(--color-glass) 60%,
		var(--color-highlight) 40%
	);
	color: var(--color-contrast-light);
	outline: none;
}

.timeline {
	display: grid;
	gap: 18px;
	padding: 22px;
	border-radius: var(--border-radius-sm);
	background: color-mix(
		in srgb,
		var(--color-surface) 80%,
		var(--color-glass) 20%
	);
	border: 1px solid var(--color-border);
	box-shadow: var(--shadow-soft);
}

.timeline-item {
	display: flex;
	gap: 18px;
	align-items: flex-start;
}

.timeline-item h3 {
	margin: 0 0 6px;
	font-size: 1.1rem;
	font-weight: var(--font-weight-semibold);
	color: var(--color-text-primary);
}

.timeline-item p {
	margin: 0;
	color: var(--color-text-secondary);
}

.timeline-item.muted h3,
.timeline-item.muted p {
	color: color-mix(
		in srgb,
		var(--color-text-secondary) 70%,
		var(--color-accent-gray) 30%
	);
}

.dot {
	display: inline-flex;
	width: 12px;
	height: 12px;
	margin-top: 6px;
	border-radius: 999px;
	background: color-mix(
		in srgb,
		var(--color-logo-red) 75%,
		var(--color-mid-red) 25%
	);
	box-shadow: 0 0 0 6px
		color-mix(in srgb, var(--color-highlight) 25%, var(--color-transparent));
}

.timeline-item.muted .dot {
	background: color-mix(
		in srgb,
		var(--color-accent-gray) 65%,
		var(--color-contrast-dark) 35%
	);
	box-shadow: 0 0 0 6px
		color-mix(in srgb, var(--color-accent-gray) 28%, var(--color-transparent));
}

.data-panel {
	display: flex;
	flex-direction: column;
	gap: 24px;
	padding: 26px 28px;
	border-radius: var(--border-radius-sm);
	background: color-mix(
		in srgb,
		var(--color-surface) 86%,
		var(--color-glass) 14%
	);
	border: 1px solid var(--color-border);
	box-shadow: var(--shadow-soft);
}

.data-panel header {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 16px;
}

.data-panel h3 {
	margin: 0;
	font-size: 1.2rem;
	font-weight: var(--font-weight-semibold);
}

.data-panel p {
	margin: 0;
	color: var(--color-text-secondary);
}

.bar-chart {
	display: flex;
	flex-direction: column;
	gap: 18px;
}

.bar {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.bar span {
	font-size: 0.95rem;
	color: var(--color-text-secondary);
}

.bar-track {
	width: 100%;
	height: 10px;
	border-radius: 999px;
	background: color-mix(
		in srgb,
		var(--color-accent-gray) 45%,
		var(--color-contrast-light) 55%
	);
	overflow: hidden;
	position: relative;
}

.bar-fill {
	height: 100%;
	border-radius: 999px;
	transition: width var(--transition-slow);
}

.bar-fill.in-progress {
	background: color-mix(
		in srgb,
		var(--color-highlight) 55%,
		var(--color-contrast-dark) 45%
	);
}

.bar-fill.delivered {
	background: color-mix(
		in srgb,
		var(--color-logo-red) 70%,
		var(--color-contrast-light) 30%
	);
}

.bar-fill.pending {
	background: color-mix(
		in srgb,
		var(--color-accent-gray) 60%,
		var(--color-logo-red) 40%
	);
}

@media (max-width: 820px) {
	.view {
		padding: 24px;
	}

	.view-header {
		flex-direction: column;
		gap: 18px;
	}

	.view-actions {
		width: 100%;
		justify-content: flex-start;
	}

	.view-action,
	.ghost-action {
		flex: 1 1 auto;
	}
}
</style>

