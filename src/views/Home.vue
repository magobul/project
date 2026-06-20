<template>
  <div class="home">
    <div class="hero">
      <div class="container">
        <h1>Первая компания в Сибири по ремонту и обработке поддонов</h1>
        <p>Мы специализируемся на ремонте, восстановлении и переборке паллет из натуральной древесины. Качественная обработка и экологичные материалы.</p>
        <router-link to="/services" class="btn">Наши услуги</router-link>
      </div>
    </div>

    <div class="services-preview container">
      <h2>Наши услуги</h2>
      
      <!-- Индикатор загрузки -->
      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
        <p>Загрузка услуг...</p>
      </div>

      <div v-else>
        <!-- Зацикленный слайдер с услугами (карусель) -->
        <div class="services-slider">
          <button class="slider-nav prev" @click="prevService">
            ←
          </button>
          
          <div class="slider-container">
            <div class="slider-track" :style="sliderTransform">
              <div 
                v-for="(service, idx) in displayedServices" 
                :key="service.id + '_' + idx"
                class="slider-card"
                :class="{ center: idx === 1 }"
                @click="setActiveService(getRealIndex(idx))"
              >
                <div class="card-image" v-if="service.image">
                  <img :src="getImageUrl(service.image)" :alt="service.name">
                </div>
                <div class="card-icon" v-else>
                  {{ getServiceIcon(service.name) }}
                </div>
                <h3>{{ service.name }}</h3>
                <p>{{ getShortDescription(service.description) }}</p>
                <button class="detail-btn" @click.stop="openModal(getRealIndex(idx))">
                  Подробнее →
                </button>
              </div>
            </div>
          </div>
          
          <button class="slider-nav next" @click="nextService">
            →
          </button>
        </div>

        <!-- Индикаторы слайдов -->
        <div class="slider-dots">
          <button 
            v-for="(service, index) in services" 
            :key="index"
            class="dot"
            :class="{ active: index === activeIndex }"
            @click="goToSlide(index)"
          ></button>
        </div>
      </div>
    </div>

    <!-- Блок "Как мы работаем" с кругами и соединительными линиями -->
    <div class="how-we-work">
      <div class="container">
        <h2>Как мы работаем</h2>
        <p class="section-subtitle">Процесс обработки и ремонта паллет из натурального дерева</p>
        
        <div class="work-steps">
          <div class="step-item" v-for="(step, index) in workSteps" :key="index">
            <div class="step-circle">{{ step.number }}</div>
            <div class="step-line" v-if="index < workSteps.length - 1"></div>
            <div class="step-content">
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="cta">
      <div class="container">
        <h2>Нужна помощь с поддонами?</h2>
        <p>Зарегистрируйтесь и оформите заявку прямо сейчас</p>
        <router-link to="/register" class="btn">Начать работу</router-link>
      </div>
    </div>

    <!-- Модальное окно с детальной информацией -->
    <Transition name="modal">
      <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <button class="modal-close" @click="closeModal">✕</button>
          
          <div class="modal-header">
            <div class="modal-image" v-if="selectedService?.image">
              <img :src="getImageUrl(selectedService.image)" :alt="selectedService.name">
            </div>
            <div class="modal-icon" v-else>
              {{ getServiceIcon(selectedService?.name) }}
            </div>
            <h3 class="modal-title">{{ selectedService?.name }}</h3>
          </div>
          
          <div class="modal-body">
            <div class="price-info-modal" v-if="selectedService?.price_info">
              💰 Стоимость: {{ selectedService.price_info }}
            </div>
            
            <div class="modal-description">
              <p>{{ selectedService?.description || 'Подробное описание услуги временно отсутствует' }}</p>
            </div>
            
            <div class="modal-features">
              <h4>Преимущества услуги:</h4>
              <ul>
                <li>✓ Профессиональный подход</li>
                <li>✓ Качественные материалы</li>
                <li>✓ Гарантия качества</li>
                <li>✓ Доступные цены</li>
              </ul>
            </div>
          </div>
          
          <div class="modal-actions">
            <router-link to="/register" class="modal-btn order" @click="closeModal">
              Заказать услугу
            </router-link>
            <button class="modal-btn close" @click="closeModal">
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default {
  name: 'Home',
  data() {
    return {
      services: [],
      activeIndex: 0,
      loading: false,
      isModalOpen: false,
      selectedService: null,
      autoPlayInterval: null,
      workSteps: [
        {
          number: '1',
          title: 'Осмотр',
          description: 'Детальный осмотр паллет, оценка состояния древесины и определение объема работ.'
        },
        {
          number: '2',
          title: 'Подготовка',
          description: 'Очистка от загрязнений, удаление старых гвоздей, подготовка к обработке.'
        },
        {
          number: '3',
          title: 'Обработка',
          description: 'Антисептическая обработка, защита от влаги и вредителей, ремонт повреждений.'
        },
        {
          number: '4',
          title: 'Сборка',
          description: 'Сборка паллет с использованием качественного крепежа и новых деревянных элементов.'
        },
        {
          number: '5',
          title: 'Контроль',
          description: 'Финальный контроль качества, проверка прочности и соответствия стандартам.'
        }
      ]
    }
  },
  computed: {
    // Создаем зацикленный массив с дублированием для бесконечной карусели
    displayedServices() {
      if (this.services.length === 0) return []
      // Создаем эффект бесконечной прокрутки: [последний, первый, второй, третий, первый]
      const len = this.services.length
      const prev = this.services[(this.activeIndex - 1 + len) % len]
      const current = this.services[this.activeIndex]
      const next = this.services[(this.activeIndex + 1) % len]
      return [prev, current, next]
    },
    
    sliderTransform() {
      // Центрируем активную карточку (второй элемент в массиве)
      return {
        transform: 'translateX(0%)',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  },
  mounted() {
    this.loadServices()
    this.startAutoPlay()
  },
  beforeUnmount() {
    this.stopAutoPlay()
  },
  methods: {
    async loadServices() {
      this.loading = true
      try {
        const response = await axios.get(`${API_URL}/api/services`)
        this.services = response.data
      } catch (error) {
        console.error('Ошибка загрузки услуг:', error)
        this.services = []
      } finally {
        this.loading = false
      }
    },
    
    getRealIndex(displayedIdx) {
      // Получаем реальный индекс из отображаемого массива
      if (displayedIdx === 0) {
        return (this.activeIndex - 1 + this.services.length) % this.services.length
      } else if (displayedIdx === 1) {
        return this.activeIndex
      } else if (displayedIdx === 2) {
        return (this.activeIndex + 1) % this.services.length
      } else {
        return (this.activeIndex + 2) % this.services.length
      }
    },
    
    setActiveService(index) {
      if (this.activeIndex !== index) {
        this.activeIndex = index
        this.resetAutoPlay()
      }
    },
    
    nextService() {
      this.activeIndex = (this.activeIndex + 1) % this.services.length
      this.resetAutoPlay()
    },
    
    prevService() {
      this.activeIndex = (this.activeIndex - 1 + this.services.length) % this.services.length
      this.resetAutoPlay()
    },
    
    goToSlide(index) {
      this.activeIndex = index
      this.resetAutoPlay()
    },
    
    openModal(index) {
      this.selectedService = this.services[index]
      this.isModalOpen = true
      this.stopAutoPlay()
    },
    
    closeModal() {
      this.isModalOpen = false
      this.selectedService = null
      this.startAutoPlay()
    },
    
    startAutoPlay() {
      if (this.autoPlayInterval) clearInterval(this.autoPlayInterval)
      this.autoPlayInterval = setInterval(() => {
        this.nextService()
      }, 10000) // Автоматическая смена каждые 10 секунд
    },
    
    stopAutoPlay() {
      if (this.autoPlayInterval) {
        clearInterval(this.autoPlayInterval)
        this.autoPlayInterval = null
      }
    },
    
    resetAutoPlay() {
      this.stopAutoPlay()
      this.startAutoPlay()
    },
    
    getShortDescription(description) {
      if (!description) return 'Нет описания'
      return description.length > 80 ? description.substring(0, 80) + '...' : description
    },
    
    getImageUrl(imagePath) {
      if (!imagePath) return null
      if (imagePath.startsWith('http')) return imagePath
      return `${API_URL}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`
    },
    
    getServiceIcon(serviceName) {
      const iconMap = [
        { keywords: ['ремонт', 'починк'], icon: '🔧' },
        { keywords: ['обработк', 'защит'], icon: '🛡️' },
        { keywords: ['восстановлен', 'реставр'], icon: '♻️' },
        { keywords: ['утилизац', 'переработ'], icon: '🌱' },
        { keywords: ['доставк', 'транспорт'], icon: '🚚' },
        { keywords: ['консультац', 'помощь'], icon: '💬' },
        { keywords: ['паллет', 'поддон'], icon: '📦' },
        { keywords: ['чистк', 'мойк'], icon: '🧹' },
        { keywords: ['сушк'], icon: '☀️' },
        { keywords: ['хранен', 'склад'], icon: '🏪' }
      ]
      
      const lowerName = serviceName?.toLowerCase() || ''
      for (const item of iconMap) {
        if (item.keywords.some(keyword => lowerName.includes(keyword))) {
          return item.icon
        }
      }
      return '📦'
    }
  }
}
</script>

<style scoped>
.home {
    background: #F2E9DE;
    
}

.hero {
  background: #91695D;
  background-size: cover;
  color: white;
  padding: 100px 0;
  text-align: center;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.btn {
  display: inline-block;
  background: #7D574B;
  color: #E2D4C2;
  box-shadow: -5px 5px 5px rgba(0, 0, 0, 0.3);
  padding: 12px 150px;
  text-decoration: none;
  border-radius: 30px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn:hover {
  background: #5E4239;
  transform: translateY(-2px);
}

.services-preview {
  padding: 80px 0;
}

.services-preview h2 {
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2rem;
  color: #5E4239;
  
}

.how-we-work {
  background: #E2D4C2;
  padding: 60px 0;
}

.how-we-work h2 {
  text-align: center;
  font-size: 2rem;
  color: #5E4239;
  margin-bottom: 0.5rem;
  font-weight: normal;
}

.section-subtitle {
  text-align: center;
  color: #7a6a62;
  font-size: 1rem;
  margin-bottom: 3rem;
}

.work-steps {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  flex-wrap: wrap;
}

.step-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  min-width: 180px;
}

.step-circle {
  width: 70px;
  height: 70px;
  background: #5E4239;
  border: 3px solid #5E4239;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
  background-color: #6D4E44;
}

.step-line {
  position: absolute;
  top: 30px;
  left: 50%;
  width: 100%;
  height: 5px;
  background: #5E4239;
  z-index: 1;
}

.step-item:last-child .step-line {
  display: none;
}

.step-content {
  text-align: center;
  margin-top: 0.5rem;
}

.step-content h3 {
  color: #5E4239;
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.step-content p {
  color: #7a6a62;
  line-height: 1.5;
  font-size: 0.95rem;
  margin: 0;
  max-width: 200px;
}

.loading-spinner {
  text-align: center;
  padding: 60px;
  color: #91695D;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #F2E9DE;
  border-top: 4px solid #91695D;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Зацикленный слайдер стили */
.services-slider {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.slider-nav {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: #91695D;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
  z-index: 10;
}

.slider-nav:hover {
  background: #5E4239;
  transform: scale(1.05);
}

.slider-container {
  flex: 1;
  overflow: visible;
  border-radius: 15px;
  padding: 20px 0;
}

.slider-track {
  display: flex;
  justify-content: center;
  gap: 2rem;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slider-card {
  flex: 0 0 300px;
  background: #5E4239;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  opacity: 0.5;
  transform: scale(0.9);
}

.slider-card.center {
  opacity: 1;
  transform: scale(1);
  border-color: #91695D;
  background: #7D574B;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.slider-card:hover:not(.center) {
  opacity: 0.7;
  transform: scale(0.95);
}

.card-image {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  overflow: hidden;
  background: #E2D4C2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.slider-card h3 {
  color: #C5907F;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.slider-card p {
  color: #C5907F;
  line-height: 1.5;
  margin-bottom: 1.2rem;
  font-size: 0.9rem;
}

.detail-btn {
  background: #5E4239;
  border: none;
  color: #C5907F;
  font-weight: bold;
  cursor: pointer;
  padding: 10px 15px;
  transition: all 0.3s ease;
  border-radius: 10px;
  font-size: 0.9rem;
}

.detail-btn:hover {
  color: #F2E9DE;
  transform: translateX(5px);
}

/* Индикаторы слайдов */
.slider-dots {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
  margin: 2rem 0;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #E2D4C2;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.dot.active {
  width: 30px;
  border-radius: 5px;
  background: #91695D;
}

.dot:hover {
  background: #91695D;
  transform: scale(1.2);
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: #FFF8F0;
  border-radius: 20px;
  max-width: 600px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  animation: modalSlideIn 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: #91695D;
  color: white;
  border: none;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1;
}

.modal-close:hover {
  background: #5E4239;
  transform: rotate(90deg);
}

.modal-header {
  text-align: center;
  padding: 2rem 2rem 1rem;
  border-bottom: 2px solid #E2D4C2;
}

.modal-image {
  width: 120px;
  height: 120px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  overflow: hidden;
  background: #E2D4C2;
}

.modal-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.modal-title {
  font-size: 2rem;
  color: #5E4239;
  margin: 0;
}

.modal-body {
  padding: 2rem;
}

.price-info-modal {
  background: #91695D;
  color: white;
  padding: 0.8rem;
  border-radius: 10px;
  text-align: center;
  font-weight: bold;
  margin-bottom: 1.5rem;
}

.modal-description {
  color: #4a3b33;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.modal-features h4 {
  color: #5E4239;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.modal-features ul {
  list-style: none;
  padding: 0;
}

.modal-features li {
  padding: 0.5rem 0;
  color: #7a6a62;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem 2rem;
  border-top: 1px solid #E2D4C2;
}

.modal-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  text-align: center;
  font-size: 1rem;
}

.modal-btn.order {
  background: #91695D;
  color: white;
}

.modal-btn.order:hover {
  background: #5E4239;
  transform: translateY(-2px);
}

.modal-btn.close {
  background: #E2D4C2;
  color: #5E4239;
}

.modal-btn.close:hover {
  background: #d4c4b0;
  transform: translateY(-2px);
}

/* Анимация модального окна */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.cta {
  background: #91695D;
  color: #E2D4C2;
  padding: 80px 0;
  text-align: center;
}

.cta h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.cta p {
  margin-bottom: 2rem;
}

.container { 
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Адаптивность */
@media (max-width: 768px) {
  .hero h1 {
    font-size: 1.8rem;
  }
  
  .hero p {
    font-size: 1rem;
  }
  
  .services-preview h2 {
    font-size: 1.6rem;
  }

  .how-we-work h2 {
    font-size: 1.6rem;
  }
  
  .slider-card {
    flex: 0 0 260px;
    padding: 1.5rem;
  }
  
  .slider-nav {
    width: 35px;
    height: 35px;
    font-size: 1.2rem;
  }
  
  .modal-title {
    font-size: 1.5rem;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }

  .work-steps {
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }
  
  .step-item {
    width: 100%;
    max-width: 300px;
  }
  
  .step-line {
    display: none !important;
  }
  
  .step-content p {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 60px 0;
  }
  
  .services-preview {
    padding: 50px 0;
  }

  .how-we-work {
    padding: 40px 0;
  }
  
  .cta {
    padding: 50px 0;
  }
  
  .slider-card {
    flex: 0 0 240px;
    padding: 1rem;
  }
  
  .slider-nav {
    width: 30px;
    height: 30px;
    font-size: 1rem;
  }
  
  .modal-image {
    width: 80px;
    height: 80px;
  }
  
  .modal-icon {
    font-size: 3rem;
  }

  .step-circle {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }

  .step-content h3 {
    font-size: 1.1rem;
  }

  .step-content p {
    font-size: 0.85rem;
  }
}
</style>