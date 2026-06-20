<template>
  <div class="gallery">
    <div class="container">
      <h2>Галерея работ</h2>
      
      <!-- Кнопки фильтрации -->
      <div class="filter-buttons">
        <button 
          v-for="category in categories" 
          :key="category"
          @click="filterCategory(category)"
          :class="{ active: activeCategory === category }"
          class="filter-btn"
        >
          {{ category }}
        </button>
      </div>
      
      <!-- Индикатор загрузки -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Загрузка изображений...</p>
      </div>
      
      <div v-else-if="filteredImages.length === 0" class="no-images">
        <p>😕 Изображения не найдены</p>
      </div>
      
      <div v-else class="gallery-grid">
        <div v-for="image in filteredImages" :key="image.id" class="gallery-item" @click="openModal(image)">
          <img 
            :src="getImageUrl(image.file_path)" 
            :alt="image.title"
            @error="handleImageError"
            loading="lazy"
            decoding="async"
          >
          <div class="image-info">
            <h4>{{ image.title || 'Без названия' }}</h4>
            <p>{{ image.description || 'Нет описания' }}</p>
            <div class="image-tags">
              <span class="image-category">{{ image.category || 'Общее' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Модальное окно -->
      <div v-if="showModal" class="modal" @click.self="closeModal">
        <div class="modal-content">
          <span class="close" @click="closeModal">&times;</span>
          
          <div class="modal-body">
            <div class="modal-image-wrapper">
              <img 
                :src="getImageUrl(selectedImage.file_path)" 
                :alt="selectedImage.title" 
                class="modal-image"
                @error="handleImageError"
                loading="lazy"
                decoding="async"
              >
            </div>
            
            <div class="modal-info">
              <div class="info-field">
                <label>Название:</label>
                <p>{{ selectedImage.title || 'Без названия' }}</p>
              </div>
              <div class="info-field">
                <label>Категория:</label>
                <p>{{ selectedImage.category || 'Общее' }}</p>
              </div>
              <div class="info-field">
                <label>Описание:</label>
                <p>{{ selectedImage.description || 'Нет описания' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default {
  name: 'Gallery',
  data() {
    return {
      images: [],
      loading: false,
      activeCategory: 'Все',
      showModal: false,
      selectedImage: null,
      categories: ['Все'],
      syncPromise: null
    }
  },
  computed: {
    filteredImages() {
      if (this.activeCategory === 'Все') {
        return this.images
      }
      return this.images.filter(img => img.category === this.activeCategory)
    }
  },
  mounted() {
    this.fastLoad()
  },
  methods: {
    getImageUrl(filePath) {
      if (!filePath) return ''
      if (filePath.startsWith('http')) {
        return filePath
      }
      if (filePath.startsWith('/gallery/')) {
        return `${API_URL}${filePath}`
      }
      return `${API_URL}/gallery/${filePath}`
    },
    
    async fastLoad() {
      this.loading = true
      
      try {
        await this.loadGallery()
        this.syncInBackground()
      } catch (error) {
        console.error('❌ Ошибка загрузки:', error)
        try {
          await this.initialLoad()
        } catch (e) {
          console.error('❌ Критическая ошибка:', e)
        }
      } finally {
        this.loading = false
      }
    },
    
    async syncInBackground() {
      if (this.syncPromise) {
        return this.syncPromise
      }
      
      this.syncPromise = (async () => {
        try {
          console.log('🔄 Фоновая синхронизация...')
          await axios.post('http://localhost:3000/api/admin/gallery/sync-files')
          console.log('✅ Фоновая синхронизация завершена')
          await this.loadGallery()
        } catch (error) {
          console.error('❌ Ошибка фоновой синхронизации:', error)
        } finally {
          this.syncPromise = null
        }
      })()
      
      return this.syncPromise
    },
    
    async initialLoad() {
      this.loading = true
      try {
        await axios.post('http://localhost:3000/api/admin/gallery/sync-files')
        await this.loadGallery()
      } catch (error) {
        console.error('❌ Ошибка:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async loadGallery() {
      try {
        const response = await axios.get('http://localhost:3000/api/gallery')
        this.images = response.data
        
        const uniqueCategories = new Set()
        this.images.forEach(img => {
          if (img.category) {
            uniqueCategories.add(img.category)
          }
        })
        this.categories = ['Все', ...Array.from(uniqueCategories)]
      } catch (error) {
        console.error('❌ Ошибка загрузки:', error)
        throw error
      }
    },
    
    filterCategory(category) {
      this.activeCategory = category
    },
    
    openModal(image) {
      this.selectedImage = image
      this.showModal = true
      document.body.style.overflow = 'hidden'
    },
    
    closeModal() {
      this.showModal = false
      this.selectedImage = null
      document.body.style.overflow = 'auto'
    },
    
    handleImageError(event) {
      console.warn(`⚠️ Ошибка загрузки: ${event.target.src}`)
      event.target.style.display = 'none'
      const parent = event.target.parentElement
      const placeholder = document.createElement('div')
      placeholder.className = 'image-placeholder'
      placeholder.innerHTML = `
        <div class="placeholder-content">
          <span class="placeholder-icon">📦</span>
          <span class="placeholder-text">Файл не найден</span>
          <span class="placeholder-path">${event.target.src}</span>
        </div>
      `
      parent.insertBefore(placeholder, event.target)
    }
  }
}
</script>

<style scoped>
.gallery {
  background-color: #E2D4C2;
  min-height: 100vh;
  padding: 50px 0;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
}

.gallery h2 {
  text-align: center;
  margin-bottom: 30px;
  font-size: 2.5rem;
  color: #5E4239;
  font-weight: 700;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 40px;
  padding: 0 20px;
}

.filter-btn {
  padding: 10px 24px;
  background: #F2E9DE;
  border: 2px solid #C5907F;
  border-radius: 25px;
  color: #5E4239;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.filter-btn:hover {
  background: #C5907F;
  color: white;
  transform: translateY(-2px);
}

.filter-btn.active {
  background: #5E4239;
  color: white;
  border-color: #5E4239;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #E2D4C2;
  border-top: 4px solid #5E4239;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  margin-top: 20px;
  color: #5E4239;
  font-size: 1.1rem;
}

.no-images {
  text-align: center;
  padding: 60px 20px;
  color: #91695D;
  font-size: 1.2rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  padding: 20px;
  max-width: 1100px;
  margin: 0 auto;
}

.gallery-item {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(94, 66, 57, 0.15);
  background: white;
  transition: all 0.3s ease;
  cursor: pointer;
}

.gallery-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 30px rgba(94, 66, 57, 0.25);
}

.gallery-item img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery-item:hover img {
  transform: scale(1.05);
}

.image-placeholder {
  width: 100%;
  height: 220px;
  background: #F2E9DE;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.placeholder-icon {
  font-size: 3rem;
}

.placeholder-text {
  color: #91695D;
  font-size: 0.9rem;
}

.placeholder-path {
  color: #999;
  font-size: 0.7rem;
  word-break: break-all;
}

.image-info {
  padding: 18px;
  background: white;
}

.image-info h4 {
  margin-bottom: 8px;
  color: #5E4239;
  font-size: 1.1rem;
  font-weight: 700;
}

.image-info p {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 12px;
  line-height: 1.4;
}

.image-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.image-category {
  display: inline-block;
  padding: 4px 12px;
  background: #F2E9DE;
  color: #5E4239;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
}

/* Модальное окно */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 950px;
  width: 95%;
  max-height: 92vh;
  overflow-y: auto;
  position: relative;
  padding: 30px;
}

.close {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 35px;
  font-weight: bold;
  color: #5E4239;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
  line-height: 1;
}

.close:hover {
  transform: scale(1.2);
  color: #C5907F;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (min-width: 768px) {
  .modal-body {
    flex-direction: row;
    gap: 30px;
    align-items: flex-start;
  }
}

.modal-image-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.modal-image {
  width: 100%;
  height: 100%;
  max-height: 500px;
  object-fit: contain;
  border-radius: 8px;
}

.modal-info {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 0;
}

.info-field {
  margin-bottom: 12px;
}

.info-field label {
  display: block;
  font-weight: 600;
  color: #5E4239;
  font-size: 0.8rem;
  margin-bottom: 2px;
}

.info-field p {
  color: #333;
  font-size: 0.95rem;
  margin: 0;
  word-break: break-all;
}

@media (max-width: 768px) {
  .gallery {
    padding: 30px 0;
  }
  
  .gallery h2 {
    font-size: 2rem;
    margin-bottom: 20px;
  }
  
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 15px;
    padding: 10px;
  }
  
  .gallery-item img {
    height: 180px;
  }
  
  .image-placeholder {
    height: 180px;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .modal-image-wrapper {
    min-height: 250px;
  }
  
  .modal-image {
    max-height: 350px;
  }
  
  .modal-info {
    min-width: unset;
    padding-top: 0;
  }
}

@media (max-width: 480px) {
  .gallery-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .gallery-item img {
    height: 200px;
  }
  
  .image-placeholder {
    height: 200px;
  }
  
  .filter-buttons {
    gap: 5px;
  }
  
  .filter-btn {
    padding: 6px 12px;
    font-size: 0.7rem;
  }
  
  .modal-image-wrapper {
    min-height: 200px;
  }
  
  .modal-image {
    max-height: 280px;
  }
}
</style>