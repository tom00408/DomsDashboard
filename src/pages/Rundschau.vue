<template>
  <div class="rundschau-container">
    <div class="header-section">
      <h2>Rundschau Upload</h2>
    </div>

    <form @submit.prevent="uploadRundschau" class="upload-form">
      <div class="form-group">
        <label for="year">Jahr der Rundschau:</label>
        <input 
          id="year"
          v-model="rundschauData.year" 
          type="number" 
          placeholder="z.B. 2024" 
          required 
        />
      </div>

      <div class="form-group">
        <label for="number">Ausgabe:</label>
        <select
          id="number"
          v-model="rundschauData.number"
          required
        >
          <option value="01">01</option>
          <option value="02">02</option>
          <option value="03">03</option>
          <option value="04">04</option>
        </select>
      </div>

      <div class="file-upload-section">
        <div class="file-group">
          <label for="pdfFile">PDF-Datei auswählen:</label>
          <input 
            id="pdfFile"
            type="file" 
            @change="handlePdfUpload" 
            accept=".pdf"
            required
          />
          <div v-if="selectedPdf" class="file-info">
            <span>✅ {{ selectedPdf.name }}</span>
            <span class="file-size">({{ formatFileSize(selectedPdf.size) }})</span>
          </div>
        </div>

        <div class="file-group">
          <label for="imageFile">Bild auswählen:</label>
          <input 
            id="imageFile"
            type="file" 
            @change="handleImageUpload" 
            accept=".png"
            required
          />
          <div v-if="selectedImage" class="file-info">
            <span>✅ {{ selectedImage.name }}</span>
            <span class="file-size">({{ formatFileSize(selectedImage.size) }})</span>
          </div>
        </div>
      </div>

      <div class="preview-section" v-if="imagePreview">
        <h4>Bildvorschau:</h4>
        <img :src="imagePreview" alt="Vorschau" class="image-preview" />
      </div>

      <div class="upload-actions">
        <button type="submit" :disabled="isUploading" class="upload-btn">
          <span v-if="isUploading">📤 Wird hochgeladen...</span>
          <span v-else>📤 Rundschau hochladen</span>
        </button>
        <button type="button" @click="resetForm" class="reset-btn">
          🔄 Zurücksetzen
        </button>
      </div>
    </form>

    <!-- Erfolgsmeldung -->
    <div v-if="uploadSuccess" class="success-message">
      <h3>✅ Rundschau erfolgreich hochgeladen!</h3>
      <p>Die Dateien wurden in Firebase Storage gespeichert.</p>
      <button @click="uploadSuccess = false" class="close-btn">Schließen</button>
    </div>

    <!-- Fehlermeldung -->
    <div v-if="uploadError" class="error-message">
      <h3>❌ Fehler beim Hochladen</h3>
      <p>{{ uploadError }}</p>
      <button @click="uploadError = ''" class="close-btn">Schließen</button>
    </div>

          <div class="rundschau-list">
        <h3>Hochgeladene Rundschauen</h3>

        
          <a href="https://rundschau.mtvgeismar.de" target="_blank" class="rundschau-link">
            <button class="rundschau-btn">
              <span class="btn-icon">📰</span>
              <span class="btn-text">Rundschauen anzeigen</span>
              <span class="btn-arrow">→</span>
            </button>
          </a>
      </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const rundschauData = ref({
  year: '',
  number: ''
});

const selectedPdf = ref(null);
const selectedImage = ref(null);
const imagePreview = ref(null);
const isUploading = ref(false);
const uploadSuccess = ref(false);
const uploadError = ref('');
const rundschauen = ref([]);
const isLoading = ref(false);

// Datei-Upload Handler
const handlePdfUpload = (event) => {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    selectedPdf.value = file;
  } else {
    alert('Bitte wählen Sie eine gültige PDF-Datei aus.');
    event.target.value = '';
  }
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    selectedImage.value = file;
    // Bildvorschau erstellen
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    alert('Bitte wählen Sie eine gültige Bilddatei aus.');
    event.target.value = '';
  }
};

// Datei in Firebase Storage hochladen
const uploadFile = async (file, folder) => {
  const timestamp = Date.now();
  const fileName = `${folder}/${rundschauData.value.year}-${rundschauData.value.number}.${folder === 'rundschau' ? 'pdf' : 'png'}`;
  const fileRef = storageRef(storage, fileName);
  
  await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(fileRef);
  return { fileName, downloadURL };
};

// Hauptfunktion zum Hochladen der Rundschau
const uploadRundschau = async () => {
  if (!selectedPdf.value || !selectedImage.value) {
    uploadError.value = 'Bitte wählen Sie sowohl eine PDF- als auch eine Bilddatei aus.';
    return;
  }

  isUploading.value = true;
  uploadError.value = '';

  try {
    // PDF hochladen
    const pdfResult = await uploadFile(selectedPdf.value, 'rundschau');
    
    // Bild hochladen
    const imageResult = await uploadFile(selectedImage.value, 'rundschauPreview');

  

    

    // Erfolg anzeigen und Formular zurücksetzen
    uploadSuccess.value = true;
    resetForm();
    
  } catch (error) {
    console.error('Fehler beim Hochladen:', error);
    uploadError.value = 'Fehler beim Hochladen: ' + error.message;
  } finally {
    isUploading.value = false;
  }
};

// Formular zurücksetzen
const resetForm = () => {
  rundschauData.value = { title: '', description: '' };
  selectedPdf.value = null;
  selectedImage.value = null;
  imagePreview.value = null;
  uploadError.value = '';
  
  // File inputs zurücksetzen
  const pdfInput = document.getElementById('pdfFile');
  const imageInput = document.getElementById('imageFile');
  if (pdfInput) pdfInput.value = '';
  if (imageInput) imageInput.value = '';
};


// Hilfsfunktionen
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

</script>

<style scoped>
.rundschau-container {
  padding: 20px;
  background: gray;
  border-radius: 20px;
  border: 4px solid black;
  max-width: 1000px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
  margin-bottom: 30px;
}

.header-section h2 {
  color: white;
  margin-bottom: 10px;
}

.header-section p {
  color: #f0f0f0;
  font-size: 1.1em;
}

.upload-form {
  background: white;
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 30px;
  border: 2px solid #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
}

.file-upload-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.file-group {
  border: 2px dashed #ccc;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  transition: border-color 0.3s;
}

.file-group:hover {
  border-color: #007bff;
}

.file-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
  color: #333;
}

.file-group input[type="file"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background: #f9f9f9;
}

.file-info {
  margin-top: 10px;
  padding: 8px;
  background: #e8f5e8;
  border-radius: 5px;
  font-size: 0.9em;
}

.file-size {
  color: #666;
  margin-left: 5px;
}

.preview-section {
  margin: 20px 0;
  text-align: center;
}

.preview-section h4 {
  margin-bottom: 10px;
  color: #333;
}

.image-preview {
  max-width: 300px;
  max-height: 200px;
  border-radius: 8px;
  border: 2px solid #ddd;
}

.upload-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 25px;
}

.upload-btn,
.reset-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-btn {
  background: #28a745;
  color: white;
}

.upload-btn:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-2px);
}

.upload-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.reset-btn {
  background: #6c757d;
  color: white;
}

.reset-btn:hover {
  background: #5a6268;
  transform: translateY(-2px);
}

.success-message,
.error-message {
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  text-align: center;
}

.success-message {
  background: #d4edda;
  border: 2px solid #c3e6cb;
  color: #155724;
}

.error-message {
  background: #f8d7da;
  border: 2px solid #f5c6cb;
  color: #721c24;
}

.close-btn {
  margin-top: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  background: #007bff;
  color: white;
  cursor: pointer;
}

.close-btn:hover {
  background: #0056b3;
}

.rundschau-list {
  background: white;
  padding: 25px;
  border-radius: 15px;
  border: 2px solid #333;
}

.rundschau-list h3 {
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px;
  color: #666;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #666;
}

.rundschau-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.rundschau-item {
  border: 2px solid #ddd;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: border-color 0.3s;
}

.rundschau-item:hover {
  border-color: #007bff;
}

.rundschau-info {
  flex: 1;
}

.rundschau-info h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.rundschau-info p {
  margin: 0 0 10px 0;
  color: #666;
}

.rundschau-meta {
  display: flex;
  gap: 15px;
  font-size: 0.9em;
  color: #888;
}

.rundschau-actions {
  display: flex;
  gap: 10px;
}

.download-btn,
.delete-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s;
}

.download-btn {
  background: #007bff;
  color: white;
}

.download-btn:hover {
  background: #0056b3;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover {
  background: #c82333;
}

@media (max-width: 768px) {
  .file-upload-section {
    grid-template-columns: 1fr;
  }
  
  .rundschau-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .rundschau-actions {
    width: 100%;
    justify-content: center;
  }
  
   .upload-actions {
   flex-direction: column;
 }
}
.rundschau-link {
  text-decoration: none;
  display: flex;
  justify-content: center;
}

.rundschau-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 28px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.rundschau-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.rundschau-btn:hover::before {
  left: 100%;
}

.rundschau-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
}

.rundschau-btn:active {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
}

.btn-icon {
  font-size: 1.3rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.btn-text {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.btn-arrow {
  font-size: 1.2rem;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.rundschau-btn:hover .btn-arrow {
  transform: translateX(5px);
}

.link-description {
  margin-top: 15px;
  color: #6c757d;
  font-size: 0.95rem;
  font-style: italic;
}

@media (max-width: 768px) {
  .rundschau-btn {
    padding: 14px 24px;
    font-size: 1rem;
    gap: 10px;
  }
  
  .btn-icon {
    font-size: 1.2rem;
  }
  
  .btn-arrow {
    font-size: 1.1rem;
  }
}
</style>