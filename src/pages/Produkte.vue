<template>
  <div class="produkte-container">
    <div class="header-section">
      <h2>Produkte</h2>
      <button @click="showAddForm = !showAddForm" class="new-btn">
        {{ showAddForm ? 'Abbrechen' : 'Neues Produkt' }}
      </button>
    </div>

    <!-- Neues Produkt Formular -->
    <form v-if="showAddForm" @submit.prevent="addProduct" class="produkt-form">
      <input v-model="newProduct.name" placeholder="Produktname" required />
      <input v-model="newProduct.price" type="number" placeholder="Preis" required />
      <input v-model="newProduct.imagepath" placeholder="Bildpfad (URL) oder Datei auswählen" />
      <input type="file" @change="handleImageUpload" accept="image/*" />
      <input v-model="newProduct.sizes" placeholder="Größen (Komma-getrennt)" />
      <div class="checkbox-row">
        <label class="custom-checkbox"><input type="checkbox" v-model="newProduct.hasName" /><span>Hat Name</span></label>
        <label class="custom-checkbox"><input type="checkbox" v-model="newProduct.hasNumber" /><span>Hat Nummer</span></label>
        <label class="custom-checkbox"><input type="checkbox" v-model="newProduct.hasInitials" /><span>Hat Initialen</span></label>
      </div>
      <button type="submit">Hinzufügen</button>
    </form>

    <!-- Produktliste -->
    <div class="produkt-liste">
      <div v-for="produkt in produkte" :key="produkt.id" class="produkt-item">
        <div class="image-container">
          <img v-if="produkt.imageUrl" :src="produkt.imageUrl" alt="Bild" class="produkt-image" @error="handleImageError" />
          <div v-else class="produkt-image-placeholder">Kein Bild</div>
        </div>
        <div class="produkt-info">
          <div><strong>{{ produkt.name }}</strong></div>
          <div>Preis: {{ formatPrice(produkt.price) }}€</div>
          <div>Größen: {{ produkt.size ? produkt.size.join(', ') : '' }}</div>
          <div class="produkt-flags">
            <span v-if="produkt.hasName" class="flag">🟢 hat Name</span>
            <span v-else class="flag">🔴 kein Name</span>
            <span v-if="produkt.hasNumber" class="flag">🟢 hat Nummer</span>
            <span v-else class="flag">🔴 keine Nummer</span>
            <span v-if="produkt.hasInitials" class="flag">🟢 hat Initialen</span>
            <span v-else class="flag">🔴 keine Initialen</span>
          </div>
        </div>
        <div class="produkt-actions">
          <button @click="editProduct(produkt)">Bearbeiten</button>
          <button @click="deleteProduct(produkt.id)" class="delete-btn">Löschen</button>
        </div>
      </div>
    </div>

    <!-- Bearbeiten-Formular -->
    <form v-if="editForm" @submit.prevent="updateProduct" class="produkt-form">
      <h3>Produkt bearbeiten</h3>
      <input v-model="editProductData.name" placeholder="Produktname" required />
      <input v-model="editProductData.price" type="number" placeholder="Preis" required />
      <input v-model="editProductData.imagepath" placeholder="Bildpfad (URL) oder Datei auswählen" />
      <input type="file" @change="handleEditImageUpload" accept="image/*" />
      <input v-model="editProductData.sizes" placeholder="Größen (Komma-getrennt)" />
      <div class="checkbox-row">
        <label class="custom-checkbox"><input type="checkbox" v-model="editProductData.hasName" /><span>Hat Name</span></label>
        <label class="custom-checkbox"><input type="checkbox" v-model="editProductData.hasNumber" /><span>Hat Nummer</span></label>
        <label class="custom-checkbox"><input type="checkbox" v-model="editProductData.hasInitials" /><span>Hat Initialen</span></label>
      </div>
      <button type="submit">Speichern</button>
      <button type="button" @click="editForm = false">Abbrechen</button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const produkte = ref([]);
const showAddForm = ref(false);
const editForm = ref(false);
const editProductData = ref({});

const newProduct = ref({
  name: '',
  price: '',
  imagepath: '',
  sizes: '',
  hasName: false,
  hasNumber: false,
  hasInitials: false
});

const loadProdukte = async () => {
  const querySnapshot = await getDocs(collection(db, 'products'));
  const produktArr = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Für jedes Produkt die Download-URL laden, falls imagepath vorhanden
  for (const produkt of produktArr) {
    if (produkt.imagepath) {
      produkt.imageUrl = await getImageUrl(produkt.imagepath);
    } else {
      produkt.imageUrl = null;
    }
  }
  produkte.value = produktArr;
};

// Funktion zum Generieren der Download-URL für ein Bild
const getImageUrl = async (imagePath) => {
  if (!imagePath) return null;
  
  try {
    // Wenn es bereits eine vollständige URL ist, verwende sie direkt
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Ansonsten generiere eine Download-URL aus Firebase Storage
    const imageRef = storageRef(storage, imagePath);
    const url = await getDownloadURL(imageRef);
    return url;
  } catch (error) {
    console.error('Fehler beim Laden des Bildes:', error);
    return null;
  }
};

// Funktion zum Hochladen eines Bildes
const uploadImage = async (file) => {
  if (!file) return null;
  
  try {
    const timestamp = Date.now();
    const fileName = `products/${timestamp}_${file.name}`;
    const imageRef = storageRef(storage, fileName);
    
    await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error('Fehler beim Hochladen des Bildes:', error);
    return null;
  }
};

const addProduct = async () => {
  const produkt = {
    name: newProduct.value.name,
    price: parseFloat(newProduct.value.price),
    imagepath: newProduct.value.imagepath,
    size: newProduct.value.sizes.split(',').map(s => s.trim()),
    hasName: newProduct.value.hasName,
    hasNumber: newProduct.value.hasNumber,
    hasInitials: newProduct.value.hasInitials
  };
  await addDoc(collection(db, 'products'), produkt);
  showAddForm.value = false;
  newProduct.value = { name: '', price: '', imagepath: '', sizes: '', hasName: false, hasNumber: false, hasInitials: false };
  await loadProdukte();
};

const deleteProduct = async (id) => {
  if (confirm('Produkt wirklich löschen?')) {
    await deleteDoc(doc(db, 'products', id));
    await loadProdukte();
  }
};

const editProduct = (produkt) => {
  editProductData.value = {
    ...produkt,
    sizes: produkt.size ? produkt.size.join(', ') : '',
    hasName: produkt.hasName ?? false,
    hasNumber: produkt.hasNumber ?? false,
    hasInitials: produkt.hasInitials ?? false
  };
  editForm.value = true;
};

const updateProduct = async () => {
  const produkt = {
    name: editProductData.value.name,
    price: parseFloat(editProductData.value.price),
    imagepath: editProductData.value.imagepath,
    size: editProductData.value.sizes.split(',').map(s => s.trim()),
    hasName: editProductData.value.hasName,
    hasNumber: editProductData.value.hasNumber,
    hasInitials: editProductData.value.hasInitials
  };
  await updateDoc(doc(db, 'products', editProductData.value.id), produkt);
  editForm.value = false;
  await loadProdukte();
};

const formatPrice = (price) => {
  return parseFloat(price).toFixed(2);
};

// Funktion zum Behandeln von Bild-Upload im neuen Produkt Formular
const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      newProduct.value.imagepath = imageUrl;
    }
  }
};

// Funktion zum Behandeln von Bild-Upload im Bearbeiten Formular
const handleEditImageUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      editProductData.value.imagepath = imageUrl;
    }
  }
};

// Funktion zum Behandeln von Bildfehlern
const handleImageError = (event) => {
  event.target.style.display = 'none';
  const placeholder = event.target.nextElementSibling;
  if (placeholder && placeholder.classList.contains('produkt-image-placeholder')) {
    placeholder.style.display = 'flex';
  }
};

onMounted(() => {
  loadProdukte();
});
</script>

<style scoped>
.produkte-container {
  padding: 20px;
  background: gray;
  border-radius: 20px;
  border: 4px solid black;
  max-width: 900px;
  margin: 0 auto;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.new-btn {
  padding: 10px 20px;
  background-color: lightblue;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1.2em;
}
.new-btn:hover {
  background-color: blanchedalmond;
  transform: scale(1.05);
}
.produkt-liste {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.produkt-item {
  background: white;
  border: 2px solid black;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 20px;
}
.produkt-image {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #ccc;
}
.image-container {
  position: relative;
  width: 60px;
  height: 60px;
}

.produkt-image-placeholder {
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 6px;
  border: 1px solid #ccc;
  color: #555;
  font-size: 0.9em;
}
.produkt-info {
  flex: 1;
}
.produkt-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.produkt-actions button {
  padding: 6px 12px;
  border-radius: 10px;
  border: none;
  background: lightblue;
  cursor: pointer;
}
.produkt-actions .delete-btn {
  background: #ff5252;
  color: white;
}
.produkt-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  background: #f7f7f7;
  border-radius: 10px;
  padding: 10px;
}
.produkt-form input {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
  min-width: 120px;
}
.produkt-form button {
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  background: lightblue;
  cursor: pointer;
}
@media (max-width: 700px) {
  .produkte-container {
    padding: 8px;
  }
  .produkt-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .produkt-actions {
    flex-direction: row;
    gap: 10px;
  }
}
.checkbox-row {
  display: flex;
  gap: 30px;
  align-items: center;
  margin: 10px 0 10px 0;
}
.custom-checkbox {
  display: flex;
  align-items: center;
  font-size: 1.15em;
  font-weight: 500;
  gap: 2px;
}
.custom-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  accent-color: #7c3aed;
  margin-right: 4px;
}
.custom-checkbox span {
  margin-left: 0;
}
.produkt-flags {
  margin-top: 4px;
  display: flex;
  gap: 12px;
  font-size: 0.98em;
  align-items: center;
}
.flag {
  padding: 2px 8px;
  border-radius: 8px;
  background: #f3f3f3;
  font-size: 0.95em;
}
</style> 