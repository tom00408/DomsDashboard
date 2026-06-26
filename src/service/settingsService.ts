import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/** Feste Basis-Status pro Kategorie – können nicht gelöscht werden */
export const BASE_ORDER_STATUSES = ['neu', 'in_bearbeitung', 'abgeschlossen'] as const;
export const BASE_MITGLIEDSAANTRAG_STATUSES = ['selected', 'new', 'archived'] as const;
export const BASE_FOEV_STATUSES = ['new', 'in_progress', 'approved', 'rejected'] as const;

export type OrderStatusBase = (typeof BASE_ORDER_STATUSES)[number];
export type MitgliedsantragStatusBase = (typeof BASE_MITGLIEDSAANTRAG_STATUSES)[number];
export type FoevStatusBase = (typeof BASE_FOEV_STATUSES)[number];

export const SETTINGS_COLLECTION = 'settings';
export const CUSTOM_STATUSES_DOC = 'customStatuses';

export interface CustomStatusesData {
	order: string[];
	mitgliedsantrag: string[];
	foevMitgliedsantrag: string[];
}

const defaultCustomStatuses: CustomStatusesData = {
	order: [],
	mitgliedsantrag: [],
	foevMitgliedsantrag: [],
};

/** Liest die Custom-Status aus Firebase (settings/customStatuses). */
export async function getCustomStatuses(): Promise<CustomStatusesData> {
	const ref = doc(db, SETTINGS_COLLECTION, CUSTOM_STATUSES_DOC);
	const snap = await getDoc(ref);
	if (!snap.exists()) {
		return { ...defaultCustomStatuses };
	}
	const data = snap.data();
	return {
		order: Array.isArray(data?.order) ? data.order : defaultCustomStatuses.order,
		mitgliedsantrag: Array.isArray(data?.mitgliedsantrag)
			? data.mitgliedsantrag
			: defaultCustomStatuses.mitgliedsantrag,
		foevMitgliedsantrag: Array.isArray(data?.foevMitgliedsantrag)
			? data.foevMitgliedsantrag
			: defaultCustomStatuses.foevMitgliedsantrag,
	};
}

/** Speichert die Custom-Status in Firebase. */
export async function setCustomStatuses(data: CustomStatusesData): Promise<void> {
	const ref = doc(db, SETTINGS_COLLECTION, CUSTOM_STATUSES_DOC);
	await setDoc(ref, data);
}

/** Fügt einen Custom-Status hinzu. Value wird als Slug gespeichert (lowercase, Leerzeichen → _). */
export async function addCustomStatus(
	category: keyof CustomStatusesData,
	label: string
): Promise<void> {
	const slug = label
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '_')
		.replace(/[^a-z0-9_äöüß-]/g, '');
	if (!slug) return;

	const current = await getCustomStatuses();
	const list = current[category];
	if (list.includes(slug)) return;

	current[category] = [...list, slug];
	await setCustomStatuses(current);
}

/** Entfernt einen Custom-Status (nur eigene, keine Basis-Status). */
export async function removeCustomStatus(
	category: keyof CustomStatusesData,
	value: string
): Promise<void> {
	const base =
		category === 'order'
			? [...BASE_ORDER_STATUSES]
			: category === 'mitgliedsantrag'
				? [...BASE_MITGLIEDSAANTRAG_STATUSES]
				: [...BASE_FOEV_STATUSES];
	if (base.includes(value as never)) return;

	const current = await getCustomStatuses();
	current[category] = current[category].filter((s) => s !== value);
	await setCustomStatuses(current);
}

/** Vollständige Status-Liste für eine Kategorie (Basis + Custom). */
export function getFullOrderStatuses(custom: CustomStatusesData): string[] {
	return [...BASE_ORDER_STATUSES, ...custom.order];
}
export function getFullMitgliedsantragStatuses(custom: CustomStatusesData): string[] {
	return [...BASE_MITGLIEDSAANTRAG_STATUSES, ...custom.mitgliedsantrag];
}
export function getFullFoevStatuses(custom: CustomStatusesData): string[] {
	return [...BASE_FOEV_STATUSES, ...custom.foevMitgliedsantrag];
}

const ORDER_LABELS: Record<string, string> = {
	neu: 'Neu',
	in_bearbeitung: 'In Bearbeitung',
	abgeschlossen: 'Abgeschlossen',
};
const MITGLIED_LABELS: Record<string, string> = {
	selected: 'Ausgewählt',
	new: 'Neu',
	archived: 'Archiviert',
};
const FOEV_LABELS: Record<string, string> = {
	new: 'Neu',
	in_progress: 'In Bearbeitung',
	approved: 'Genehmigt',
	rejected: 'Abgelehnt',
};

function formatCustomLabel(value: string): string {
	return value
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getOrderStatusLabel(value: string): string {
	return ORDER_LABELS[value] ?? formatCustomLabel(value);
}
export function getMitgliedsantragStatusLabel(value: string): string {
	return MITGLIED_LABELS[value] ?? formatCustomLabel(value);
}
export function getFoevStatusLabel(value: string): string {
	return FOEV_LABELS[value] ?? formatCustomLabel(value);
}
