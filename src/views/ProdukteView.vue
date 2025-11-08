<template>
	<section class="view">
		<header class="view-header">
				<h2>Produkte</h2>
			<div class="view-actions">
				<button
					type="button"
					class="view-action"
					@click="openCreateModal">
					Produkt hinzufügen
				</button>
			</div>
		</header>

		<div v-if="error" class="state state-error">
			<p>{{ error }}</p>
			<button type="button" class="ghost-action" @click="loadProducts">
				Erneut versuchen
			</button>
		</div>

		<div v-else-if="loading" class="state state-loading">
			Produkte werden geladen …
		</div>

		<div v-else-if="products.length" class="product-grid">
			<article
				v-for="product in products"
				:key="product.id"
				class="product-card">
				<div class="product-image">
					<img
						:src="product.imageUrl"
						:alt="product.name"
						loading="lazy"
						class="product-image-front"
						@error="handleImageError" />
					<img
						v-if="product.imageBackUrl"
						:src="product.imageBackUrl"
						:alt="`${product.name} Rückseite`"
						loading="lazy"
						class="product-image-back"
						@error="handleImageError" />
					<span v-if="product.imageBackUrl" class="image-badge"
						>Front & Rück</span
					>
				</div>

				<header class="product-header">
					<div>
						<h3>{{ product.name }}</h3>
						<p class="product-type">
							{{
								product.isUnisex ? 'Unisex' : 'Größenspezifisch'
							}}
						</p>
					</div>
					<span class="product-price">{{
						formatPrice(product.price)
					}}</span>
				</header>

				<ul class="product-flags">
					<li v-if="product.hasName">Namensdruck</li>
					<li v-if="product.hasNumber">Nummerndruck</li>
					<li v-if="product.hasInitials">Initialen</li>
					<li
						v-if="
							!product.hasName &&
							!product.hasNumber &&
							!product.hasInitials
						">
						Keine Personalisierung
					</li>
				</ul>

				<div v-if="product.size.length" class="product-sizes">
					<span
						v-for="size in product.size"
						:key="size"
						class="size-chip">
						{{ size }}
					</span>
				</div>

				<footer class="product-footer">
					<button
						type="button"
						class="ghost-action"
						@click="openEditModal(product)">
						Bearbeiten
					</button>
					<button
						type="button"
						class="danger-action"
						@click="deleteProduct(product)">
						Löschen
					</button>
				</footer>
			</article>
		</div>

		<div v-else class="state state-empty">
			Noch keine Produkte vorhanden. Lege das erste Produkt an, um
			loszulegen.
		</div>
        <!-- Modal -->
		<div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
			<div class="modal">
				<header class="modal-header">
					<h3>
						{{ editingId ? 'Produkt bearbeiten' : 'Neues Produkt' }}
					</h3>
					<button
						type="button"
						class="icon-button"
						@click="closeModal"
						aria-label="Modal schließen">
						×
					</button>
			</header>

				<form class="modal-form" @submit.prevent="submitProduct">
					<div class="field">
						<label for="product-name">Produktname</label>
						<input
							id="product-name"
							v-model="productForm.name"
							type="text"
							placeholder="z. B. Socken"
							required />
				</div>

                    <div class="field">
							<label for="product-price">Preis (EUR)</label>
							<input
								id="product-price"
								v-model.number="productForm.price"
								type="number"
								min="0"
								step="0.01"
								inputmode="decimal"
								required />
				</div>
					<div class="field-group">
						
						<div class="field image-upload-field">
							<label>Vorderseitenbild</label>
							<div
								class="upload-zone"
								:class="{
									'has-file': productImageFile,
									'drag-over': dragOverFront,
								}"
								@drop.prevent="handleDrop($event, 'front')"
								@dragover.prevent="dragOverFront = true"
								@dragleave.prevent="dragOverFront = false"
								@click="fileInputFront?.click()">
								<input
									ref="fileInputFront"
									id="product-file"
									type="file"
									accept="image/*"
									@change="onImageSelected"
									style="display: none" />
								<div
									v-if="productImageFile"
									class="upload-zone-content">
									<div class="upload-icon success">✓</div>
									<p class="upload-text">
										{{ productImageFile.name }}
									</p>
									<button
										type="button"
										class="upload-remove"
										@click.stop="removeFrontImage">
										Entfernen
									</button>
				</div>
								<div v-else-if="editingId && productForm.imagepath && !deleteFrontImage" class="upload-zone-content">
									<div class="upload-icon">📷</div>
									<p class="upload-text">Bild ändern</p>
									<p class="upload-hint">Drag & Drop oder klicken</p>
									<button
										type="button"
										class="upload-delete"
										@click.stop="markFrontImageForDeletion">
										Bild löschen
									</button>
				</div>
								<div v-else-if="deleteFrontImage" class="upload-zone-content">
									<div class="upload-icon optional">🗑️</div>
									<p class="upload-text">Wird gelöscht</p>
									<button
										type="button"
										class="upload-restore"
										@click.stop="unmarkFrontImageForDeletion">
										Wiederherstellen
									</button>
								</div>
								<div v-else class="upload-zone-content">
									<div class="upload-icon">📷</div>
									<p class="upload-text">
										{{ editingId ? 'Bild ändern' : 'Bild auswählen' }}
									</p>
									<p class="upload-hint">
										Drag & Drop oder klicken
									</p>
								</div>
							</div>
						</div>
						<div class="field image-upload-field">
							<label
								>Rückseitenbild
								<span class="label-optional"
									>(optional)</span
								></label
							>
							<div
								class="upload-zone"
								:class="{
									'has-file': productImageBackFile,
									'drag-over': dragOverBack,
									'is-optional':
										!productImageBackFile && !editingId,
								}"
								@drop.prevent="handleDrop($event, 'back')"
								@dragover.prevent="dragOverBack = true"
								@dragleave.prevent="dragOverBack = false"
								@click="fileInputBack?.click()">
								<input
									ref="fileInputBack"
									id="product-file-back"
									type="file"
									accept="image/*"
									@change="onImageBackSelected"
									style="display: none" />
								<div
									v-if="productImageBackFile"
									class="upload-zone-content">
									<div class="upload-icon success">✓</div>
									<p class="upload-text">
										{{ productImageBackFile.name }}
									</p>
									<button
										type="button"
										class="upload-remove"
										@click.stop="removeBackImage">
										Entfernen
									</button>
								</div>
								<div
									v-else-if="
										editingId && productForm.imagepath_back && !deleteBackImage
									"
									class="upload-zone-content">
									<div class="upload-icon">📷</div>
									<p class="upload-text">
										Rückseitenbild ändern
									</p>
									<p class="upload-hint">
										Drag & Drop oder klicken
									</p>
									<button
										type="button"
										class="upload-delete"
										@click.stop="markBackImageForDeletion">
										Bild löschen
									</button>
								</div>
								<div v-else-if="deleteBackImage" class="upload-zone-content">
									<div class="upload-icon optional">🗑️</div>
									<p class="upload-text">Wird gelöscht</p>
									<button
										type="button"
										class="upload-restore"
										@click.stop="unmarkBackImageForDeletion">
										Wiederherstellen
									</button>
								</div>
								<div v-else class="upload-zone-content">
									<div class="upload-icon optional">+</div>
									<p class="upload-text">
										Rückseitenbild hinzufügen
									</p>
									<p class="upload-hint">
										Optional – Drag & Drop oder klicken
									</p>
								</div>
							</div>
						</div>
					</div>

					<div class="field">
						<label>Bildvorschau</label>
						<div class="image-preview-grid">
							<div class="image-preview">
								<img
									:src="previewUrl"
									alt="Produktbild-Vorschau Vorderseite" />
								<span class="preview-caption">Vorderseite</span>
							</div>
							<div
								class="image-preview"
								:class="{ 'preview-empty': !previewBackUrl }">
								<img
									v-if="previewBackUrl"
									:src="previewBackUrl"
									alt="Produktbild-Vorschau Rückseite" />
								<span class="preview-caption">Rückseite</span>
								<p
									v-if="!previewBackUrl"
									class="preview-placeholder">
									Noch kein Bild
								</p>
							</div>
						</div>
					</div>

					<div class="field">
						<label for="product-sizes"
							>Größen (eine pro Zeile)</label
						>
						<textarea
							id="product-sizes"
							v-model="sizeInput"
							rows="5"
							placeholder="S (35-37)
M (38-40)
L (41-43)"></textarea>
					</div>

					<div class="field field-checklist">
						<label class="checkbox">
							<input
								type="checkbox"
								v-model="productForm.isUnisex" />
							<span>Unisex</span>
						</label>
						<label class="checkbox">
							<input
								type="checkbox"
								v-model="productForm.hasName" />
							<span>Namensdruck möglich</span>
						</label>
						<label class="checkbox">
							<input
								type="checkbox"
								v-model="productForm.hasNumber" />
							<span>Nummerndruck möglich</span>
						</label>
						<label class="checkbox">
							<input
								type="checkbox"
								v-model="productForm.hasInitials" />
							<span>Initialen möglich</span>
						</label>
					</div>

					<p v-if="formError" class="form-error">{{ formError }}</p>

					<div class="modal-actions">
						<button
							type="button"
							class="ghost-action"
							@click="closeModal"
							:disabled="isSaving">
							Abbrechen
						</button>
						<button
							type="submit"
							class="view-action"
							:disabled="isSaving">
							{{
								isSaving
									? 'Speichern …'
									: editingId
									? 'Speichern'
									: 'Anlegen'
							}}
						</button>
					</div>
				</form>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	orderBy,
	query,
	updateDoc,
	type DocumentData,
	type QueryDocumentSnapshot,
} from 'firebase/firestore';
import {
	deleteObject,
	getDownloadURL,
	ref as createStorageRef,
	uploadBytes,
} from 'firebase/storage';
import { db, storage } from '../service/firebase';

interface ProductData {
	id: string;
	name: string;
	price: number;
	imagepath: string;
	imagepath_back?: string;
	isUnisex: boolean;
	hasInitials: boolean;
	hasName: boolean;
	hasNumber: boolean;
	size: string[];
}

interface Product extends ProductData {
	imageUrl: string;
	imageBackUrl: string | null;
}

interface ProductFormData {
	name: string;
	price: number | null;
	imagepath: string;
	imagepath_back: string;
	isUnisex: boolean;
	hasInitials: boolean;
	hasName: boolean;
	hasNumber: boolean;
}

const products = ref<Product[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const showModal = ref(false);
const isSaving = ref(false);
const editingId = ref<string | null>(null);
const formError = ref<string | null>(null);

const productForm = reactive<ProductFormData>({
	name: '',
	price: null,
	imagepath: '',
	imagepath_back: '',
	isUnisex: true, // Standardmäßig aktiviert
	hasInitials: false,
	hasName: false,
	hasNumber: false,
});

const fallbackImage = new URL('../assets/noimage.png', import.meta.url)
	.href;
const productsCollection = collection(db, 'products');

const sizeInput = ref('');
const productImageFile = ref<File | null>(null);
const productImageBackFile = ref<File | null>(null);
const previewUrl = ref(fallbackImage);
const previewBackUrl = ref<string | null>(null);
const dragOverFront = ref(false);
const dragOverBack = ref(false);
const deleteFrontImage = ref(false);
const deleteBackImage = ref(false);
const fileInputFront = ref<HTMLInputElement | null>(null);
const fileInputBack = ref<HTMLInputElement | null>(null);
let objectUrl: string | null = null;
let objectBackUrl: string | null = null;

const formatPrice = (price: number | undefined) => {
	if (typeof price !== 'number' || Number.isNaN(price)) {
		return '—';
	}

	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2,
	}).format(price);
};

const normaliseProductSnapshot = (
	productDoc: QueryDocumentSnapshot<DocumentData>
): Product => {
	const data = productDoc.data() as Partial<ProductData> &
		Record<string, unknown>;

	const size = Array.isArray(data.size)
		? data.size.filter(
				(entry): entry is string =>
					typeof entry === 'string' && entry.trim().length > 0
		  )
		: [];

	const priceValue =
		typeof data.price === 'number'
			? data.price
			: Number.isFinite(Number(data.price))
			? Number(data.price)
			: 0;

	return {
		id: productDoc.id,
		name:
			typeof data.name === 'string' && data.name.trim()
				? data.name
				: 'Unbenanntes Produkt',
		price: priceValue,
		imagepath: typeof data.imagepath === 'string' ? data.imagepath : '',
		imagepath_back:
			typeof data.imagepath_back === 'string' ? data.imagepath_back : '',
		isUnisex: Boolean(data.isUnisex),
		hasInitials: Boolean(data.hasInitials),
		hasName: Boolean(data.hasName),
		hasNumber: Boolean(data.hasNumber),
		size,
		imageUrl: fallbackImage,
		imageBackUrl: null,
	};
};

const resolveImageUrl = async (path?: string): Promise<string | null> => {
	if (!path) {
		return null;
	}

	if (/^https?:\/\//i.test(path)) {
		return path;
	}

	try {
		const storageRef = createStorageRef(storage, path.replace(/^\/+/, ''));
		return await getDownloadURL(storageRef);
	} catch (err) {
		console.error('Fehler beim Laden des Produktbildes:', err);
		return null;
	}
};

const loadProducts = async () => {
	loading.value = true;
	error.value = null;

	try {
		const productsQuery = query(productsCollection, orderBy('name', 'asc'));
		const snapshot = await getDocs(productsQuery);
		const normalised = snapshot.docs.map(normaliseProductSnapshot);
		const enhanced = await Promise.all(
			normalised.map(async (product) => ({
				...product,
				imageUrl:
					(await resolveImageUrl(product.imagepath)) ?? fallbackImage,
				imageBackUrl: await resolveImageUrl(product.imagepath_back),
			}))
		);
		products.value = enhanced;
	} catch (err) {
		console.error('Fehler beim Laden der Produkte:', err);
		error.value = 'Produkte konnten nicht geladen werden.';
	} finally {
		loading.value = false;
	}
};

const resetForm = () => {
	if (objectUrl) {
		URL.revokeObjectURL(objectUrl);
		objectUrl = null;
	}
	if (objectBackUrl) {
		URL.revokeObjectURL(objectBackUrl);
		objectBackUrl = null;
	}

	productForm.name = '';
	productForm.price = null;
	productForm.imagepath = '';
	productForm.imagepath_back = '';
	productForm.isUnisex = true; // Standardwert wiederherstellen
	productForm.hasInitials = false;
	productForm.hasName = false;
	productForm.hasNumber = false;
	sizeInput.value = '';
	editingId.value = null;
	formError.value = null;
	productImageFile.value = null;
	productImageBackFile.value = null;
	previewUrl.value = fallbackImage;
	previewBackUrl.value = null;
	dragOverFront.value = false;
	dragOverBack.value = false;
	deleteFrontImage.value = false;
	deleteBackImage.value = false;
};

const openCreateModal = () => {
	resetForm();
	showModal.value = true;
};

const openEditModal = (product: Product) => {
	editingId.value = product.id;
	productForm.name = product.name;
	productForm.price = product.price;
	productForm.imagepath = product.imagepath;
	productForm.imagepath_back = product.imagepath_back ?? '';
	productForm.isUnisex = product.isUnisex;
	productForm.hasInitials = product.hasInitials;
	productForm.hasName = product.hasName;
	productForm.hasNumber = product.hasNumber;
	sizeInput.value = product.size.join('\n');
	formError.value = null;
	productImageFile.value = null;
	productImageBackFile.value = null;
	previewUrl.value = product.imageUrl;
	previewBackUrl.value = product.imageBackUrl;
	showModal.value = true;
};

const closeModal = () => {
	if (isSaving.value) {
		return;
	}

	showModal.value = false;
	resetForm();
};

const onImageSelected = (event: Event) => {
	const target = event.target as HTMLInputElement | null;
	if (!target?.files?.length) {
		productImageFile.value = null;
		if (!editingId.value) {
			previewUrl.value = fallbackImage;
		}
		return;
	}

	const file = target.files[0] ?? null;
	productImageFile.value = file;

	if (objectUrl) {
		URL.revokeObjectURL(objectUrl);
		objectUrl = null;
	}

	if (file) {
		objectUrl = URL.createObjectURL(file);
		previewUrl.value = objectUrl;
	}
};

const onImageBackSelected = (event: Event) => {
	const target = event.target as HTMLInputElement | null;
	if (!target?.files?.length) {
		productImageBackFile.value = null;
		if (!editingId.value) {
			previewBackUrl.value = null;
		}
		return;
	}

	const file = target.files[0] ?? null;
	productImageBackFile.value = file;

	if (objectBackUrl) {
		URL.revokeObjectURL(objectBackUrl);
		objectBackUrl = null;
	}

	if (file) {
		objectBackUrl = URL.createObjectURL(file);
		previewBackUrl.value = objectBackUrl;
	}
};

const handleDrop = (event: DragEvent, type: 'front' | 'back') => {
	if (type === 'front') {
		dragOverFront.value = false;
	} else {
		dragOverBack.value = false;
	}

	const files = event.dataTransfer?.files;
	if (!files || files.length === 0) {
		return;
	}

	const file = files[0];
	if (!file || !file.type.startsWith('image/')) {
		return;
	}

	if (type === 'front') {
		productImageFile.value = file;
		if (objectUrl) {
			URL.revokeObjectURL(objectUrl);
			objectUrl = null;
		}
		objectUrl = URL.createObjectURL(file);
		previewUrl.value = objectUrl;
	} else {
		productImageBackFile.value = file;
		if (objectBackUrl) {
			URL.revokeObjectURL(objectBackUrl);
			objectBackUrl = null;
		}
		objectBackUrl = URL.createObjectURL(file);
		previewBackUrl.value = objectBackUrl;
	}
};

const handleImageError = (event: Event) => {
	const target = event.target as HTMLImageElement | null;
	if (target) {
		target.src = fallbackImage;
	}
};

const removeFrontImage = async () => {
	productImageFile.value = null;
	if (objectUrl) {
		URL.revokeObjectURL(objectUrl);
		objectUrl = null;
	}
	if (editingId.value && productForm.imagepath) {
		const url = await resolveImageUrl(productForm.imagepath);
		previewUrl.value = url || fallbackImage;
	} else {
		previewUrl.value = fallbackImage;
	}
};

const removeBackImage = async () => {
	productImageBackFile.value = null;
	if (objectBackUrl) {
		URL.revokeObjectURL(objectBackUrl);
		objectBackUrl = null;
	}
	if (editingId.value && productForm.imagepath_back) {
		previewBackUrl.value = await resolveImageUrl(
			productForm.imagepath_back
		);
	} else {
		previewBackUrl.value = null;
	}
};

const markFrontImageForDeletion = () => {
	deleteFrontImage.value = true;
	previewUrl.value = fallbackImage;
};

const unmarkFrontImageForDeletion = async () => {
	deleteFrontImage.value = false;
	if (editingId.value && productForm.imagepath) {
		const url = await resolveImageUrl(productForm.imagepath);
		previewUrl.value = url || fallbackImage;
	} else {
		previewUrl.value = fallbackImage;
	}
};

const markBackImageForDeletion = () => {
	deleteBackImage.value = true;
	previewBackUrl.value = null;
};

const unmarkBackImageForDeletion = async () => {
	deleteBackImage.value = false;
	if (editingId.value && productForm.imagepath_back) {
		previewBackUrl.value = await resolveImageUrl(
			productForm.imagepath_back
		);
	} else {
		previewBackUrl.value = null;
	}
};

const submitProduct = async () => {
	formError.value = null;

	if (!productForm.name.trim()) {
		formError.value = 'Bitte einen Produktnamen angeben.';
		return;
	}

	if (productForm.price === null || Number.isNaN(productForm.price)) {
		formError.value = 'Bitte einen gültigen Preis eintragen.';
		return;
	}

	const sizeValues = sizeInput.value
		.split('\n')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);

	const existingImagePath = editingId.value
		? productForm.imagepath.trim()
		: '';
	const existingImagePathBack = editingId.value
		? productForm.imagepath_back.trim()
		: '';
	let imagePath = existingImagePath;
	let imagePathBack = existingImagePathBack;

	if (deleteFrontImage.value && existingImagePath && !/^https?:\/\//i.test(existingImagePath)) {
		try {
			await deleteObject(createStorageRef(storage, existingImagePath));
		} catch (err) {
			console.warn('Vorderseitenbild konnte nicht gelöscht werden:', err);
		}
		imagePath = '';
		deleteFrontImage.value = false;
	}

	if (deleteBackImage.value && existingImagePathBack && !/^https?:\/\//i.test(existingImagePathBack)) {
		try {
			await deleteObject(createStorageRef(storage, existingImagePathBack));
		} catch (err) {
			console.warn('Rückseitenbild konnte nicht gelöscht werden:', err);
		}
		imagePathBack = '';
		deleteBackImage.value = false;
	}

	if (productImageFile.value) {
		const file = productImageFile.value;
		const sanitizedName = file.name.replace(/\s+/g, '_');
		const storagePath = `product-images/${Date.now()}-${sanitizedName}`;
		const storageRef = createStorageRef(storage, storagePath);
		await uploadBytes(storageRef, file);
		imagePath = storagePath;
		deleteFrontImage.value = false;

		if (
			editingId.value &&
			existingImagePath &&
			!/^https?:\/\//i.test(existingImagePath) &&
			!deleteFrontImage.value
		) {
			try {
				await deleteObject(
					createStorageRef(storage, existingImagePath)
				);
			} catch (err) {
				console.warn(
					'Altes Produktbild konnte nicht entfernt werden:',
					err
				);
			}
		}
	}

	if (productImageBackFile.value) {
		const file = productImageBackFile.value;
		const sanitizedName = file.name.replace(/\s+/g, '_');
		const storagePath = `product-images/${Date.now()}-back-${sanitizedName}`;
		const storageRef = createStorageRef(storage, storagePath);
		await uploadBytes(storageRef, file);
		imagePathBack = storagePath;
		deleteBackImage.value = false;

		if (
			editingId.value &&
			existingImagePathBack &&
			!/^https?:\/\//i.test(existingImagePathBack) &&
			!deleteBackImage.value
		) {
			try {
				await deleteObject(
					createStorageRef(storage, existingImagePathBack)
				);
			} catch (err) {
				console.warn(
					'Altes Rückseitenbild konnte nicht entfernt werden:',
					err
				);
			}
		}
	}

	const payload = {
		name: productForm.name.trim(),
		price: productForm.price,
		imagepath: imagePath || '',
		imagepath_back: imagePathBack || '',
		isUnisex: productForm.isUnisex,
		hasInitials: productForm.hasInitials,
		hasName: productForm.hasName,
		hasNumber: productForm.hasNumber,
		size: sizeValues,
	};

	isSaving.value = true;

	try {
		if (editingId.value) {
			await updateDoc(doc(productsCollection, editingId.value), payload);
		} else {
			await addDoc(productsCollection, payload);
		}

		showModal.value = false;
		resetForm();
		await loadProducts();
	} catch (err) {
		console.error('Fehler beim Speichern des Produkts:', err);
		formError.value = 'Das Produkt konnte nicht gespeichert werden.';
	} finally {
		isSaving.value = false;
	}
};

const deleteProduct = async (product: Product) => {
	if (
		!confirm(`Soll das Produkt "${product.name}" wirklich gelöscht werden?`)
	) {
		return;
	}

	try {
		await deleteDoc(doc(productsCollection, product.id));

		if (product.imagepath && !/^https?:\/\//i.test(product.imagepath)) {
			try {
				await deleteObject(
					createStorageRef(storage, product.imagepath)
				);
			} catch (err) {
				console.warn('Produktbild konnte nicht gelöscht werden:', err);
			}
		}
		if (
			product.imagepath_back &&
			!/^https?:\/\//i.test(product.imagepath_back)
		) {
			try {
				await deleteObject(
					createStorageRef(storage, product.imagepath_back)
				);
			} catch (err) {
				console.warn(
					'Rückseitenbild konnte nicht gelöscht werden:',
					err
				);
			}
		}

		await loadProducts();
	} catch (err) {
		console.error('Fehler beim Löschen des Produkts:', err);
		alert('Produkt konnte nicht gelöscht werden.');
	}
};

onMounted(loadProducts);
</script>

<style scoped>
.view {
	display: flex;
	flex-direction: column;
	gap: 28px;
	padding: 32px;
	background: var(--color-surface-elevated, #fff);
	border-radius: var(--border-radius-md, 18px);
	border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
	box-shadow: var(--shadow-soft, 0 12px 32px rgba(15, 20, 40, 0.08));
	color: var(--color-text-primary, #1c1f2b);
}

.view-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 24px;
	flex-wrap: wrap;
}

.view-header h2 {
	margin: 0 0 8px;
	font-size: 1.8rem;
	font-weight: var(--font-weight-semibold, 600);
}

.view-header p {
	margin: 0;
	max-width: 52ch;
	color: var(--color-text-secondary, rgba(28, 31, 43, 0.64));
	line-height: 1.6;
}

.view-actions {
	display: flex;
	gap: 12px;
	align-items: center;
}

.view-action {
	border: none;
	border-radius: var(--border-radius-sm, 12px);
	padding: 12px 20px;
	font-weight: var(--font-weight-medium, 500);
	cursor: pointer;
	background: color-mix(
		in srgb,
		var(--color-logo-red, #b40024) 72%,
		var(--color-dark-red, #6a0015) 28%
	);
	color: var(--color-contrast-light, #fff);
	box-shadow: 0 10px 20px -12px rgba(180, 0, 36, 0.65);
	transition: transform 160ms ease, box-shadow 160ms ease,
		background 160ms ease;
}

.view-action:hover,
.view-action:focus-visible {
	transform: translateY(-2px);
	background: color-mix(
		in srgb,
		var(--color-logo-red, #b40024) 58%,
		var(--color-contrast-dark, #33000c) 42%
	);
	box-shadow: 0 12px 24px -10px rgba(180, 0, 36, 0.55);
	outline: none;
}

.ghost-action {
	border-radius: var(--border-radius-sm, 12px);
	padding: 10px 18px;
	font-weight: var(--font-weight-medium, 500);
	cursor: pointer;
	background: color-mix(
		in srgb,
		var(--color-surface, #f6f7fb) 78%,
		var(--color-glass, rgba(255, 255, 255, 0.48)) 22%
	);
	border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
	color: var(--color-text-primary, #1c1f2b);
	transition: transform 160ms ease, background 160ms ease, color 160ms ease;
}

.ghost-action:hover,
.ghost-action:focus-visible {
	transform: translateY(-1px);
	background: color-mix(
		in srgb,
		var(--color-surface, #f6f7fb) 60%,
		var(--color-highlight, #b40024) 40%
	);
	color: var(--color-contrast-light, #fff);
	outline: none;
}

.state {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 18px 20px;
	border-radius: var(--border-radius-sm, 12px);
	border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
	background: color-mix(
		in srgb,
		var(--color-surface, #f6f7fb) 88%,
		var(--color-glass, rgba(255, 255, 255, 0.6)) 12%
	);
	color: var(--color-text-secondary, rgba(28, 31, 43, 0.74));
}

.state.state-loading,
.state.state-empty {
	justify-content: center;
}

.state.state-error {
	border-color: color-mix(
		in srgb,
		var(--color-logo-red, #b40024) 40%,
		var(--color-border, rgba(0, 0, 0, 0.12)) 60%
	);
	color: color-mix(in srgb, var(--color-logo-red, #b40024) 65%, #1c1f2b 35%);
}

.product-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 24px;
}

.product-card {
	display: flex;
	flex-direction: column;
	gap: 18px;
	padding: 24px;
	border-radius: var(--border-radius-sm, 14px);
	background: color-mix(
		in srgb,
		var(--color-surface, #ffffff) 80%,
		var(--color-glass, rgba(255, 255, 255, 0.55)) 20%
	);
	border: 1px solid var(--color-border, rgba(0, 0, 0, 0.06));
	box-shadow: 0 22px 40px -26px rgba(15, 20, 40, 0.3);
}

.product-image {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--border-radius-sm, 14px);
	overflow: hidden;
	background: color-mix(
		in srgb,
		var(--color-surface, #f6f7fb) 70%,
		var(--color-glass, rgba(255, 255, 255, 0.9)) 30%
	);
	border: 1px dashed rgba(28, 31, 43, 0.08);
	min-height: 160px;
}

.product-image-front {
	width: 100%;
	height: 100%;
	object-fit: contain;
	display: block;
}

.product-image-back {
	position: absolute;
	right: 12px;
	bottom: 12px;
	width: 96px;
	height: 96px;
	border-radius: var(--border-radius-sm, 12px);
	object-fit: cover;
	box-shadow: 0 12px 22px -14px rgba(15, 20, 40, 0.4);
	border: 2px solid rgba(255, 255, 255, 0.8);
	background: color-mix(
		in srgb,
		var(--color-surface, #ffffff) 80%,
		var(--color-glass, rgba(255, 255, 255, 0.6)) 20%
	);
}

.image-badge {
	position: absolute;
	top: 12px;
	left: 12px;
	padding: 6px 10px;
	border-radius: 999px;
	font-size: 0.75rem;
	font-weight: var(--font-weight-medium, 500);
	letter-spacing: 0.08em;
	text-transform: uppercase;
	background: color-mix(
		in srgb,
		var(--color-logo-red, #b40024) 15%,
		var(--color-surface, #ffffff) 85%
	);
	color: var(--color-text-secondary, rgba(28, 31, 43, 0.7));
	box-shadow: 0 10px 20px -16px rgba(15, 20, 40, 0.45);
}

.product-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
}

.product-header h3 {
	margin: 0;
	font-size: 1.2rem;
	font-weight: var(--font-weight-semibold, 600);
	color: var(--color-text-primary, #1c1f2b);
}

.product-type {
	margin: 4px 0 0;
	color: var(--color-text-secondary, rgba(28, 31, 43, 0.6));
	font-size: 0.95rem;
}

.product-price {
	font-weight: var(--font-weight-semibold, 600);
	font-size: 1.1rem;
	color: var(--color-logo-red, #b40024);
	background: color-mix(
		in srgb,
		var(--color-logo-red, #b40024) 18%,
		var(--color-glass, rgba(255, 255, 255, 0.85)) 82%
	);
	padding: 6px 12px;
	border-radius: 999px;
}

.product-flags {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	list-style: none;
	margin: 0;
	padding: 0;
}

.product-flags li {
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 0.85rem;
	background: color-mix(
		in srgb,
		var(--color-logo-red, #b40024) 10%,
		var(--color-surface, #f6f7fb) 90%
	);
	color: var(--color-text-secondary, rgba(28, 31, 43, 0.7));
	border: 1px solid rgba(180, 0, 36, 0.14);
}

.product-sizes {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}

.size-chip {
	padding: 6px 10px;
	border-radius: 10px;
	background: color-mix(
		in srgb,
		var(--color-surface, #f6f7fb) 88%,
		var(--color-contrast-light, #ffffff) 12%
	);
	border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
	font-size: 0.9rem;
	color: var(--color-text-primary, #1c1f2b);
}

.product-footer {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
}

.modal-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(12, 16, 32, 0.55);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 32px;
	z-index: 90;
}

.modal {
	width: min(520px, 100%);
	max-height: 90vh;
	background: var(--color-surface-elevated, #ffffff);
	border-radius: var(--border-radius-md, 18px);
	border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
	box-shadow: 0 26px 48px -24px rgba(12, 16, 32, 0.42);
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 26px 28px;
	overflow: hidden;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	flex-shrink: 0;
}

.modal-header h3 {
	margin: 0;
	font-size: 1.4rem;
	font-weight: var(--font-weight-semibold, 600);
}

.icon-button {
	border: none;
	background: transparent;
	font-size: 1.8rem;
	line-height: 1;
	cursor: pointer;
	color: var(--color-text-secondary, rgba(28, 31, 43, 0.55));
	padding: 0;
}

.icon-button:hover,
.icon-button:focus-visible {
	color: var(--color-text-primary, #1c1f2b);
	outline: none;
}

.modal-form {
	display: flex;
	flex-direction: column;
	gap: 18px;
	flex: 1;
	overflow-y: auto;
	min-height: 0;
	padding-right: 8px;
	margin-right: -8px;
}

.modal-form::-webkit-scrollbar {
	width: 8px;
}

.modal-form::-webkit-scrollbar-track {
	background: transparent;
}

.modal-form::-webkit-scrollbar-thumb {
	background: var(--color-border, rgba(0, 0, 0, 0.2));
	border-radius: 4px;
}

.modal-form::-webkit-scrollbar-thumb:hover {
	background: var(--color-border, rgba(0, 0, 0, 0.3));
}

.field {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.field-group {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16px;
}

label {
	font-weight: var(--font-weight-medium, 500);
	color: var(--color-text-primary, #1c1f2b);
}

input,
textarea {
	border-radius: var(--border-radius-sm, 12px);
	border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
	background: color-mix(
		in srgb,
		var(--color-surface, #ffffff) 92%,
		var(--color-glass, rgba(255, 255, 255, 0.85)) 8%
	);
	padding: 12px 14px;
	font-size: 1rem;
	color: var(--color-text-primary, #1c1f2b);
	transition: border-color 160ms ease, box-shadow 160ms ease;
	resize: vertical;
}

.field-hint {
	margin: 0;
	font-size: 0.85rem;
	color: var(--color-text-secondary, rgba(28, 31, 43, 0.6));
}

.label-optional {
	font-weight: var(--font-weight-normal, 400);
	color: var(--color-text-secondary, rgba(28, 31, 43, 0.6));
}

.upload-zone {
	position: relative;
	border: 2px dashed var(--color-border, rgba(0, 0, 0, 0.12));
	border-radius: var(--border-radius-sm, 12px);
	background: color-mix(
		in srgb,
		var(--color-surface, #ffffff) 96%,
		var(--color-glass, rgba(255, 255, 255, 0.9)) 4%
	);
	padding: 32px 20px;
	cursor: pointer;
	transition: all 200ms ease;
	min-height: 120px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.upload-zone:hover {
	border-color: var(--color-logo-red, #b40024);
	background: color-mix(
		in srgb,
		var(--color-surface, #ffffff) 98%,
		var(--color-logo-red, #b40024) 2%
	);
	transform: translateY(-1px);
	box-shadow: 0 4px 12px -4px rgba(180, 0, 36, 0.15);
}

.upload-zone.drag-over {
	border-color: var(--color-logo-red, #b40024);
	background: color-mix(
		in srgb,
		var(--color-surface, #ffffff) 95%,
		var(--color-logo-red, #b40024) 5%
	);
	border-style: solid;
	box-shadow: 0 0 0 4px rgba(180, 0, 36, 0.1);
}

.upload-zone.has-file {
	border-color: var(--color-logo-red, #b40024);
	border-style: solid;
	background: color-mix(
		in srgb,
		var(--color-surface, #ffffff) 98%,
		var(--color-logo-red, #b40024) 2%
	);
}

.upload-zone.is-optional {
	border-color: var(--color-border, rgba(0, 0, 0, 0.08));
	opacity: 0.85;
}

.upload-zone.is-optional:hover {
	opacity: 1;
}

.upload-zone-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px;
	width: 100%;
}

.upload-icon {
	font-size: 2.5rem;
	line-height: 1;
	margin-bottom: 4px;
	opacity: 0.7;
	transition: opacity 200ms ease, transform 200ms ease;
}

.upload-zone:hover .upload-icon {
	opacity: 1;
	transform: scale(1.05);
}

.upload-icon.success {
	color: var(--color-logo-red, #b40024);
	font-size: 2rem;
	font-weight: bold;
	opacity: 1;
}

.upload-icon.optional {
	font-size: 2rem;
	font-weight: 300;
	opacity: 0.5;
}

.upload-text {
	margin: 0;
	font-size: 0.95rem;
	font-weight: var(--font-weight-medium, 500);
	color: var(--color-text-primary, #1c1f2b);
	text-align: center;
}

.upload-hint {
	margin: 0;
	font-size: 0.8rem;
	color: var(--color-text-secondary, rgba(28, 31, 43, 0.55));
	text-align: center;
}

.upload-remove {
	margin-top: 8px;
	padding: 6px 14px;
	border: none;
	border-radius: var(--border-radius-sm, 8px);
	background: color-mix(
		in srgb,
		var(--color-surface, #ffffff) 90%,
		var(--color-accent-gray, #e0e0e0) 10%
	);
	color: var(--color-text-primary, #1c1f2b);
	font-size: 0.85rem;
	font-weight: var(--font-weight-medium, 500);
	cursor: pointer;
	transition: all 160ms ease;
}

.upload-remove:hover {
	background: color-mix(
		in srgb,
		var(--color-logo-red, #b40024) 15%,
		var(--color-surface, #ffffff) 85%
	);
	color: var(--color-logo-red, #b40024);
	transform: translateY(-1px);
}

.upload-delete {
	margin-top: 8px;
	padding: 6px 14px;
	border: none;
	border-radius: var(--border-radius-sm, 8px);
	background: color-mix(
		in srgb,
		var(--color-logo-red, #b40024) 20%,
		var(--color-surface, #ffffff) 80%
	);
	color: var(--color-logo-red, #b40024);
	font-size: 0.85rem;
	font-weight: var(--font-weight-medium, 500);
	cursor: pointer;
	transition: all 160ms ease;
}

.upload-delete:hover {
	background: color-mix(
		in srgb,
		var(--color-logo-red, #b40024) 35%,
		var(--color-surface, #ffffff) 65%
	);
	color: var(--color-contrast-light, #ffffff);
	transform: translateY(-1px);
}

.upload-restore {
	margin-top: 8px;
	padding: 6px 14px;
	border: none;
	border-radius: var(--border-radius-sm, 8px);
	background: color-mix(
		in srgb,
		var(--color-surface, #ffffff) 90%,
		var(--color-accent-gray, #e0e0e0) 10%
	);
	color: var(--color-text-primary, #1c1f2b);
	font-size: 0.85rem;
	font-weight: var(--font-weight-medium, 500);
	cursor: pointer;
	transition: all 160ms ease;
}

.upload-restore:hover {
	background: color-mix(
		in srgb,
		var(--color-surface, #ffffff) 95%,
		var(--color-accent-gray, #e0e0e0) 5%
	);
	transform: translateY(-1px);
}

.image-preview-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	gap: 16px;
}

.image-preview {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 200px;
	border-radius: var(--border-radius-sm, 12px);
	border: 1px dashed var(--color-border, rgba(0, 0, 0, 0.12));
	background: color-mix(
		in srgb,
		var(--color-surface, #f6f7fb) 82%,
		var(--color-glass, rgba(255, 255, 255, 0.7)) 18%
	);
	padding: 16px;
	text-align: center;
}

.image-preview img {
	max-width: 100%;
	max-height: 140px;
	object-fit: contain;
	margin-bottom: 8px;
}

.preview-caption {
	font-size: 0.85rem;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--color-text-secondary, rgba(28, 31, 43, 0.6));
}

.preview-placeholder {
	margin: 6px 0 0;
	font-size: 0.85rem;
	color: var(--color-text-secondary, rgba(28, 31, 43, 0.55));
}

.preview-empty {
	opacity: 0.65;
}

.danger-action {
	border: none;
	border-radius: var(--border-radius-sm, 12px);
	padding: 10px 18px;
	font-weight: var(--font-weight-medium, 500);
	cursor: pointer;
	background: color-mix(
		in srgb,
		var(--color-mid-red, #d93f3f) 65%,
		var(--color-contrast-dark, #33000c) 35%
	);
	color: var(--color-contrast-light, #fff);
	box-shadow: 0 10px 18px -14px rgba(217, 63, 63, 0.75);
	transition: transform 160ms ease, box-shadow 160ms ease,
		background 160ms ease;
}

.danger-action:hover,
.danger-action:focus-visible {
	transform: translateY(-2px);
	background: color-mix(
		in srgb,
		var(--color-mid-red, #d93f3f) 52%,
		var(--color-contrast-dark, #33000c) 48%
	);
	box-shadow: 0 12px 22px -12px rgba(217, 63, 63, 0.7);
	outline: none;
}

input:focus,
textarea:focus {
	outline: none;
	border-color: color-mix(
		in srgb,
		var(--color-logo-red, #b40024) 40%,
		var(--color-border, rgba(0, 0, 0, 0.08)) 60%
	);
	box-shadow: 0 0 0 3px rgba(180, 0, 36, 0.15);
}

.field-checklist {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
}

.checkbox {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 12px;
	border-radius: var(--border-radius-sm, 12px);
	border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
	background: color-mix(
		in srgb,
		var(--color-surface, #f6f7fb) 80%,
		var(--color-glass, rgba(255, 255, 255, 0.7)) 20%
	);
	cursor: pointer;
}

.checkbox input {
	width: 18px;
	height: 18px;
	border-radius: 6px;
}

.form-error {
	margin: 0;
	padding: 10px 12px;
	border-radius: var(--border-radius-sm, 12px);
	background: color-mix(
		in srgb,
		var(--color-logo-red, #b40024) 18%,
		var(--color-surface, #ffffff) 82%
	);
	color: color-mix(
		in srgb,
		var(--color-logo-red, #b40024) 78%,
		var(--color-text-primary, #1c1f2b) 22%
	);
	border: 1px solid rgba(180, 0, 36, 0.2);
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	flex-shrink: 0;
	margin-top: auto;
}

@media (max-width: 1080px) {
	.product-grid {
		gap: 20px;
	}
}

@media (max-width: 960px) {
	.view {
		padding: 24px;
	}

	.product-grid {
		grid-template-columns: 1fr;
	}

	.field-group {
		grid-template-columns: 1fr;
	}

	.field-checklist {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 640px) {
	.modal {
		padding: 22px 20px;
	}
}
</style>
