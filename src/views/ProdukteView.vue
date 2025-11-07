<template>
	<section class="view">
		<header class="view-header">
			<div>
				<h2>Produkte</h2>
				<p>
					Organisiere das Sortiment, kontrolliere Lagerstände und plane Nachbestellungen
					proaktiv.
				</p>
			</div>
			<div class="view-actions">
				<button type="button" class="ghost-action">Inventur starten</button>
				<button type="button" class="view-action">Produkt hinzufügen</button>
			</div>
		</header>
		<div class="product-grid">
			<article class="product-card">
				<header>
					<h3>Heimtrikot 24/25</h3>
					<span class="badge live">Top-Seller</span>
				</header>
				<p>Verfügbar in allen Größen · Lieferzeit 3 Tage</p>
				<footer>
					<span class="stock">
						<strong>82</strong>
						im Lager
					</span>
					<button type="button">Details</button>
				</footer>
			</article>
			<article class="product-card">
				<header>
					<h3>Trainingsjacke Premium</h3>
					<span class="badge scheduled">Nachschub geplant</span>
				</header>
				<p>
					Hochwertige Softshell · Lieferung neuer Charge am 11. November bestätigt.
				</p>
				<footer>
					<span class="stock">
						<strong>24</strong>
						im Lager
					</span>
					<button type="button">Details</button>
				</footer>
			</article>
			<article class="product-card">
				<header>
					<h3>Vereins-Accessoires</h3>
					<span class="badge draft">Kampagne in Planung</span>
				</header>
				<p>Neue Merchandise-Linie mit Fokus auf Jugendabteilung und Fans.</p>
				<footer>
					<span class="stock">
						<strong>—</strong>
						vorbestellbar
					</span>
					<button type="button">Details</button>
				</footer>
			</article>
		</div>
		<div class="table">
			<header class="table-header">
				<h3>Lagerbewegungen</h3>
				<p>Synchronisiert mit dem Zentrallager · letzte Aktualisierung 4 Minuten</p>
			</header>
			<div class="table-body">
				<div class="table-row table-head">
					<span>Datum</span>
					<span>Produkt</span>
					<span>Aktion</span>
					<span>Menge</span>
					<span>Status</span>
				</div>
				<div class="table-row">
					<span>07.11.25</span>
					<span>Torwarthandschuhe Elite</span>
					<span>Wareneingang</span>
					<span>36</span>
					<span class="status success">Erfasst</span>
				</div>
				<div class="table-row">
					<span>06.11.25</span>
					<span>Schienbeinschoner Youth</span>
					<span>Warenausgang</span>
					<span>18</span>
					<span class="status info">Ausgeliefert</span>
				</div>
				<div class="table-row">
					<span>05.11.25</span>
					<span>Teamtasche XL</span>
					<span>Reservierung</span>
					<span>12</span>
					<span class="status warning">Bestätigung offen</span>
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
	gap: 32px;
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
	max-width: 52ch;
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

.product-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
	gap: 20px;
}

.product-card {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 24px;
	border-radius: var(--border-radius-sm);
	background: color-mix(
		in srgb,
		var(--color-surface) 75%,
		var(--color-glass) 25%
	);
	border: 1px solid var(--color-border);
	box-shadow: var(--shadow-soft);
	position: relative;
	overflow: hidden;
}

.product-card::after {
	content: '';
	position: absolute;
	inset: -20% 40% auto -30%;
	height: 140%;
	background: radial-gradient(
		120% 120% at 0% 20%,
		color-mix(in srgb, var(--color-highlight) 18%, var(--color-transparent)) 0%,
		var(--color-transparent) 70%
	);
	pointer-events: none;
}

.product-card > * {
	position: relative;
	z-index: 1;
}

.product-card header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
}

.product-card h3 {
	margin: 0;
	font-size: 1.2rem;
	font-weight: var(--font-weight-semibold);
}

.product-card p {
	margin: 0;
	color: var(--color-text-secondary);
	line-height: 1.5;
}

.badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 0.75rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	background: color-mix(
		in srgb,
		var(--color-glass) 80%,
		var(--color-highlight) 20%
	);
	color: var(--color-text-primary);
}

.badge.live {
	background: color-mix(
		in srgb,
		var(--color-logo-red) 65%,
		var(--color-contrast-light) 35%
	);
	color: var(--color-contrast-light);
}

.badge.scheduled {
	background: color-mix(
		in srgb,
		var(--color-mid-red) 55%,
		var(--color-accent-gray) 45%
	);
	color: var(--color-contrast-light);
}

.badge.draft {
	background: color-mix(
		in srgb,
		var(--color-accent-gray) 70%,
		var(--color-contrast-light) 30%
	);
	color: var(--color-text-primary);
}

.product-card footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
}

.stock {
	display: flex;
	align-items: baseline;
	gap: 8px;
	font-size: 0.95rem;
	color: var(--color-text-secondary);
}

.stock strong {
	font-size: 1.4rem;
	font-weight: var(--font-weight-semibold);
	color: var(--color-text-primary);
}

.product-card footer button {
	border: none;
	border-radius: var(--border-radius-sm);
	background: color-mix(
		in srgb,
		var(--color-logo-red) 60%,
		var(--color-contrast-dark) 40%
	);
	color: var(--color-contrast-light);
	padding: 10px 16px;
	font-size: 0.9rem;
	font-weight: var(--font-weight-medium);
	cursor: pointer;
	transition: transform var(--transition-default),
		box-shadow var(--transition-default), background var(--transition-default);
	box-shadow: var(--shadow-soft);
}

.product-card footer button:hover,
.product-card footer button:focus-visible {
	transform: translateY(-2px);
	background: color-mix(
		in srgb,
		var(--color-logo-red) 45%,
		var(--color-contrast-dark) 55%
	);
	outline: none;
}

.table {
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 26px 28px;
	border-radius: var(--border-radius-sm);
	background: color-mix(
		in srgb,
		var(--color-surface) 84%,
		var(--color-glass) 16%
	);
	border: 1px solid var(--color-border);
	box-shadow: var(--shadow-soft);
}

.table-header h3 {
	margin: 0 0 6px;
	font-size: 1.2rem;
	font-weight: var(--font-weight-semibold);
}

.table-header p {
	margin: 0;
	color: var(--color-text-secondary);
}

.table-body {
	display: grid;
	gap: 12px;
}

.table-row {
	display: grid;
	grid-template-columns: 120px 1fr 160px 110px 140px;
	gap: 18px;
	align-items: center;
	padding: 14px 18px;
	border-radius: var(--border-radius-sm);
	background: color-mix(
		in srgb,
		var(--color-surface) 88%,
		var(--color-accent-gray) 12%
	);
	color: var(--color-text-primary);
}

.table-row span {
	font-size: 0.95rem;
}

.table-head span {
	text-transform: uppercase;
	font-size: 0.75rem;
	letter-spacing: 0.12em;
	color: var(--color-text-secondary);
}

.status {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 0.8rem;
	font-weight: var(--font-weight-medium);
}

.status.success {
	background: color-mix(
		in srgb,
		var(--color-logo-red) 45%,
		var(--color-contrast-light) 55%
	);
	color: var(--color-contrast-light);
}

.status.info {
	background: color-mix(
		in srgb,
		var(--color-mid-red) 55%,
		var(--color-contrast-dark) 45%
	);
	color: var(--color-contrast-light);
}

.status.warning {
	background: color-mix(
		in srgb,
		var(--color-accent-gray) 75%,
		var(--color-contrast-dark) 25%
	);
	color: var(--color-text-primary);
}

@media (max-width: 920px) {
	.view {
		padding: 24px;
	}

	.view-header {
		flex-direction: column;
		gap: 18px;
	}

	.view-actions {
		width: 100%;
		flex-wrap: wrap;
	}

	.view-action,
	.ghost-action {
		flex: 1 1 auto;
	}

	.table-row {
		grid-template-columns: 120px 1fr;
		row-gap: 12px;
	}

	.table-row span:nth-child(n + 3) {
		opacity: 0.85;
	}
}

@media (max-width: 620px) {
	.product-grid {
		grid-template-columns: 1fr;
	}

	.table-row {
		grid-template-columns: 1fr;
	}
}
</style>

