<template>
  <div class="create-request">
    <div class="container">
      <div class="request-card">
        <!-- Шаги -->
        <div class="steps">
          <div class="step-item" :class="{ active: currentStep === 1 }">
            <span class="step-number">1</span>
            <span>Выбор услуги</span>
          </div>
          <div class="step-item" :class="{ active: currentStep === 2 }">
            <span class="step-number">2</span>
            <span>Доставка</span>
          </div>
          <div class="step-item" :class="{ active: currentStep === 3 }">
            <span class="step-number">3</span>
            <span>Подтверждение</span>
          </div>
        </div>

        <!-- Шаг 1: Выбор услуги -->
        <div v-show="currentStep === 1" class="step-pane">
          <h3 class="step-title">Выберите тип услуги</h3>
          
          <div class="services-categories">
            <div 
              v-for="category in serviceCategories" 
              :key="category.id"
              class="category-item"
              :class="{ expanded: expandedCategory === category.id }"
            >
              <div class="category-header" @click="toggleCategory(category.id)">
                <div class="category-info">
                  <span class="category-name">{{ category.name }}</span>
                  <span class="category-price" v-if="category.basePrice">от {{ formatPrice(category.basePrice) }} руб.</span>
                </div>
                <i class="toggle-icon" :class="expandedCategory === category.id ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
              </div>
              
              <div class="subservices-list" v-if="expandedCategory === category.id && category.subservices">
                <label 
                  v-for="sub in category.subservices" 
                  :key="sub.id"
                  class="subservice-item"
                  :class="{ selected: selectedService === sub.id }"
                >
                  <input type="radio" v-model="selectedService" :value="sub.id" @change="onServiceChange">
                  <div class="subservice-info">
                    <span class="subservice-name">{{ sub.name }}</span>
                    <span class="subservice-price">{{ formatPrice(sub.price) }} руб.</span>
                  </div>
                </label>
              </div>
              
              <div class="simple-service" v-if="expandedCategory === category.id && !category.subservices">
                <label class="service-item" :class="{ selected: selectedService === category.id }">
                  <input type="radio" v-model="selectedService" :value="category.id" @change="onServiceChange">
                  <div class="service-info">
                    <span class="service-name">{{ category.name }}</span>
                    <span class="service-price">{{ formatPrice(category.price) }} руб.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Калькулятор подбора паллет по размерам</label>
            <div class="calculator-wrapper">
              <div class="size-inputs-group">
                <div class="size-input-wrapper">
                  <span class="size-label">Длина (мм)</span>
                  <input type="number" v-model.number="customLength" placeholder="1200" class="size-input-field">
                </div>
                <div class="size-input-wrapper">
                  <span class="size-label">Ширина (мм)</span>
                  <input type="number" v-model.number="customWidth" placeholder="800" class="size-input-field">
                </div>
                <div class="size-input-wrapper">
                  <span class="size-label">Высота (мм)</span>
                  <input type="number" v-model.number="customHeight" placeholder="145" class="size-input-field">
                </div>
                <button type="button" class="btn-find" @click="findMatchingPallet" :disabled="calculating">
                  {{ calculating ? 'Поиск...' : 'Подобрать' }}
                </button>
              </div>
              
              <div class="quick-sizes">
                <span class="quick-label">Быстрый выбор:</span>
                <div class="quick-buttons">
                  <button v-for="preset in presetSizes" :key="preset.name" type="button" class="quick-size-btn" @click="applyPreset(preset)">
                    {{ preset.name }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="recommended-pallet" v-if="recommendedPallet">
            <div class="recommended-content">
              <div class="recommended-icon">⭐</div>
              <div class="recommended-text">
                <div class="recommended-title">Рекомендуемый тип паллета:</div>
                <div class="recommended-name">{{ recommendedPallet.name }}</div>
                <div class="recommended-price">{{ formatPrice(recommendedPallet.price) }} руб./шт.</div>
              </div>
              <button type="button" class="btn-use-recommended" @click="selectRecommendedPallet">Использовать</button>
            </div>
          </div>

          <div class="form-group">
            <label>Выберите тип паллет:</label>
            <div v-if="loadingPalletTypes" class="loading">Загрузка типов паллет...</div>
            <div v-else>
              <div class="pallet-types">
                <div 
                  v-for="type in palletTypes" 
                  :key="type.id"
                  class="pallet-type-card"
                  :class="{ selected: selectedPalletType === type.type_code }"
                  @click="selectPalletType(type.type_code)"
                >
                  <div class="pallet-type-name">{{ type.name }}</div>
                  <div class="pallet-type-dimensions">{{ type.dimensions }}</div>
                  <div class="pallet-type-price">{{ formatPrice(type.price) }} руб.</div>
                </div>
              </div>
              
              <!-- 3D Модель -->
              <div class="model-viewer">
                <div class="model-header">
                  3D модель паллеты - {{ selectedPalletTypeName }}
                  <span v-if="modelLoading" class="model-status">(загрузка...)</span>
                  <span v-else-if="modelError" class="model-status error">(ошибка)</span>
                </div>
                <div id="model-container" style="width: 100%; height: 400px; background: #E2D4C2; border-radius: 8px; position: relative;"></div>
                <div class="model-hint">Вращайте мышью для просмотра модели</div>
              </div>

              <!-- Калькулятор нагрузки на паллету -->
              <div class="load-calculator">
                <div class="load-calculator-header" @click="loadCalculatorExpanded = !loadCalculatorExpanded">
                  <span class="load-calculator-title">Калькулятор нагрузки на паллету</span>
                  <i class="toggle-icon" :class="loadCalculatorExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                </div>
                
                <div class="load-calculator-content" v-show="loadCalculatorExpanded">
                  <div class="load-input-group">
                    <label>Вес груза (кг):</label>
                    <input 
                      type="number" 
                      v-model.number="loadWeight" 
                      placeholder="Введите вес груза"
                      class="load-input"
                      min="0"
                      step="10"
                    >
                  </div>
                  
                  <div class="load-input-group">
                    <label>Тип нагрузки:</label>
                    <div class="load-type-buttons">
                      <button 
                        v-for="type in loadTypes" 
                        :key="type.value"
                        type="button"
                        class="load-type-btn"
                        :class="{ active: loadType === type.value }"
                        @click="loadType = type.value"
                      >
                        {{ type.label }}
                      </button>
                    </div>
                  </div>
                  
                  <div class="load-input-group">
                    <label>Условия эксплуатации:</label>
                    <div class="conditions-buttons">
                      <button 
                        v-for="cond in conditionsList" 
                        :key="cond.value"
                        type="button"
                        class="condition-btn"
                        :class="{ active: loadConditions === cond.value }"
                        @click="loadConditions = cond.value"
                      >
                        {{ cond.label }}
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    class="btn-calculate-load" 
                    @click="calculateLoad" 
                    :disabled="calculatingLoad"
                  >
                    {{ calculatingLoad ? 'Расчет...' : 'Рассчитать нагрузку' }}
                  </button>
                  
                  <!-- Результаты расчета -->
                  <div class="load-result" v-if="loadResult">
                    <div class="load-result-header" :class="loadResult.status">
                      <span class="result-icon">{{ loadResult.status === 'success' ? '✅' : '❌' }}</span>
                      <span class="result-conclusion">{{ loadResult.conclusion }}</span>
                    </div>
                    
                    <div class="load-result-details">
                      <div class="detail-row">
                        <span>Максимальная нагрузка паллеты:</span>
                        <strong>{{ formatLoadNumber(loadResult.calculations.allowed_load) }} кг</strong>
                      </div>
                      <div class="detail-row">
                        <span>Фактическая нагрузка:</span>
                        <strong :class="{ 'text-danger': loadWeight > loadResult.calculations.allowed_load }">
                          {{ formatLoadNumber(loadWeight) }} кг
                        </strong>
                      </div>
                      <div class="detail-row">
                        <span>Загрузка паллеты:</span>
                        <div class="load-progress">
                          <div 
                            class="load-progress-bar" 
                            :style="{ width: Math.min(loadResult.calculations.load_percent, 100) + '%' }"
                            :class="{
                              'progress-success': loadResult.calculations.load_percent <= 70,
                              'progress-warning': loadResult.calculations.load_percent > 70 && loadResult.calculations.load_percent <= 90,
                              'progress-danger': loadResult.calculations.load_percent > 90
                            }"
                          ></div>
                          <span class="load-percent">{{ Math.min(loadResult.calculations.load_percent, 100) }}%</span>
                        </div>
                      </div>
                      <div class="detail-row recommendation">
                        <span>Рекомендация:</span>
                        <span>{{ loadResult.recommendation }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Количество паллет:</label>
            <input type="number" v-model.number="palletCount" min="1" class="quantity-input" @input="validatePalletCount">
          </div>

          <div class="order-summary" v-if="serviceCost > 0">
            <div class="summary-row">
              <span>Тип паллет:</span>
              <span>{{ selectedPalletTypeName }}</span>
            </div>
            <div class="summary-row">
              <span>Размеры паллета:</span>
              <span>{{ selectedPalletDimensions }}</span>
            </div>
            <div class="summary-row">
              <span>Цена паллета:</span>
              <span>{{ formatPrice(palletPrice) }} руб.</span>
            </div>
            <div class="summary-row">
              <span>Стоимость услуг (за шт.):</span>
              <span>{{ formatPrice(servicePricePerUnit) }} руб.</span>
            </div>
            <div class="summary-row">
              <span>Количество паллет:</span>
              <span>{{ palletCount }} шт.</span>
            </div>
            <div class="summary-row total">
              <span>Итого к оплате:</span>
              <span>{{ formatPrice(serviceCost) }} руб.</span>
            </div>
          </div>

          <div class="nav-buttons">
            <button type="button" class="btn btn-secondary" disabled style="visibility: hidden;">Назад</button>
            <button type="button" class="btn btn-primary" @click="nextStep" :disabled="!isServiceSelected">Далее →</button>
          </div>
        </div>

        <!-- Шаг 2: Доставка -->
        <div v-show="currentStep === 2" class="step-pane">
          <h3 class="step-title">Способ доставки</h3>
          
          <div class="delivery-options">
            <label class="delivery-item" :class="{ selected: deliveryMethod === 'pickup' }">
              <input type="radio" v-model="deliveryMethod" value="pickup">
              <div class="delivery-info">
                <span class="delivery-name">Самовывоз</span>
                <span class="delivery-price">Бесплатно</span>
              </div>
            </label>

            <label class="delivery-item" :class="{ selected: deliveryMethod === 'delivery' }">
              <input type="radio" v-model="deliveryMethod" value="delivery">
              <div class="delivery-info">
                <span class="delivery-name">Доставка</span>
                <span class="delivery-price">3500 руб.</span>
              </div>
            </label>
          </div>

          <div class="form-group" v-if="deliveryMethod === 'delivery'">
            <label>Адрес доставки *</label>
            <textarea v-model="deliveryAddress" rows="3" placeholder="Введите полный адрес доставки" class="address-input"></textarea>
          </div>

          <div class="form-group">
            <label>Комментарий к заказу</label>
            <textarea v-model="comment" rows="3" placeholder="Дополнительная информация..." class="comment-input"></textarea>
          </div>

          <div class="order-summary" v-if="serviceCost > 0">
            <div class="summary-row">
              <span>Тип паллет:</span>
              <span>{{ selectedPalletTypeName }}</span>
            </div>
            <div class="summary-row">
              <span>Стоимость услуг:</span>
              <span>{{ formatPrice(serviceCost) }} руб.</span>
            </div>
            <div class="summary-row">
              <span>Доставка:</span>
              <span>{{ formatPrice(deliveryCost) }} руб.</span>
            </div>
            <div class="summary-row total">
              <span>Итого к оплате:</span>
              <span>{{ formatPrice(totalCost) }} руб.</span>
            </div>
          </div>

          <div class="nav-buttons">
            <button type="button" class="btn btn-secondary" @click="prevStep">← Назад</button>
            <button type="button" class="btn btn-primary" @click="nextStep" :disabled="!isDeliveryValid">Далее →</button>
          </div>
        </div>

        <!-- Шаг 3: Подтверждение -->
        <div v-show="currentStep === 3" class="step-pane">
          <h3 class="step-title">Подтверждение заявки</h3>
          
          <div class="confirm-block">
            <div class="confirm-row">
              <span class="confirm-label">Услуга:</span>
              <span class="confirm-value">{{ selectedServiceName }}</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Тип паллет:</span>
              <span class="confirm-value">{{ selectedPalletTypeName }}</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Размеры паллета:</span>
              <span class="confirm-value">{{ selectedPalletDimensions }}</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Цена паллета:</span>
              <span class="confirm-value">{{ formatPrice(palletPrice) }} руб.</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Количество паллет:</span>
              <span class="confirm-value">{{ palletCount }} шт.</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Стоимость услуг:</span>
              <span class="confirm-value">{{ formatPrice(serviceCost) }} руб.</span>
            </div>
            <div class="confirm-row">
              <span class="confirm-label">Доставка:</span>
              <span class="confirm-value">{{ formatPrice(deliveryCost) }} руб.</span>
            </div>
            <div class="confirm-row total">
              <span class="confirm-label">Итого к оплате:</span>
              <span class="confirm-value">{{ formatPrice(totalCost) }} руб.</span>
            </div>
          </div>

          <div class="nav-buttons">
            <button type="button" class="btn btn-secondary" @click="prevStep">← Назад</button>
            <button type="button" class="btn btn-primary" @click="createRequest" :disabled="submitting">
              {{ submitting ? 'Отправка...' : 'Отправить заявку' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

let scene = null
let camera = null
let renderer = null
let controls = null
let currentModel = null
let animationId = null

export default {
  name: 'CreateRequest',
  data() {
    return {
      currentStep: 1,
      selectedService: 'wash',
      selectedPalletType: 'euro1',
      palletCount: 1,
      deliveryMethod: 'pickup',
      deliveryAddress: '',
      comment: '',
      submitting: false,
      calculating: false,
      user: null,
      expandedCategory: 'processing',
      customLength: 1200,
      customWidth: 800,
      customHeight: 145,
      recommendedPallet: null,
      palletTypes: [],
      loadingPalletTypes: true,
      modelLoading: false,
      modelError: false,
      modelInitialized: false,
      modelCache: new Map(),
      initAttempts: 0,
      // Данные для калькулятора нагрузки
      loadCalculatorExpanded: true,
      loadWeight: null,
      loadType: 'uniform',
      loadConditions: 'dry',
      calculatingLoad: false,
      loadResult: null,
      loadTypes: [
        { value: 'uniform', label: 'Равномерная' },
        { value: 'point', label: 'Точечная' }
      ],
      conditionsList: [
        { value: 'dry', label: 'Сухие условия' },
        { value: 'wet', label: 'Влажные условия' },
        { value: 'aggressive', label: 'Агрессивная среда' }
      ]
    }
  },
  computed: {
    serviceCategories() {
      return [
        { id: 'repair', name: 'Ремонт поддонов ', price: 800, basePrice: 800, subservices: null },
        { id: 'overhaul', name: 'Переборка поддонов ', price: 1200, basePrice: 1200, subservices: null },
        { id: 'restoration', name: 'Восстановление поддонов ', price: 1500, basePrice: 1500, subservices: null },
        { id: 'loading', name: 'Загрузка/выгрузка ', price: 500, basePrice: 500, subservices: null },
        {
          id: 'processing',
          name: 'Обработка поддонов ',
          basePrice: 1500,
          subservices: [
            { id: 'wash', name: 'Промывка и очистка', price: 1500 },
            { id: 'antiseptic', name: 'Антисептическая обработка', price: 2500 },
            { id: 'complex', name: 'Комплексная обработка', price: 4750 }
          ]
        }
      ]
    },
    getSelectedServiceDetails() {
      for (const category of this.serviceCategories) {
        if (this.selectedService === category.id) {
          return { name: category.name, price: category.price, category: category.id, isSubservice: false }
        }
        if (category.subservices) {
          const sub = category.subservices.find(s => s.id === this.selectedService)
          if (sub) return { name: sub.name, price: sub.price, category: category.id, parentName: category.name, isSubservice: true }
        }
      }
      return null
    },
    selectedServiceName() {
      const details = this.getSelectedServiceDetails
      return details ? details.name : ''
    },
    servicePricePerUnit() {
      const details = this.getSelectedServiceDetails
      return details ? details.price : 0
    },
    palletPrice() {
      const pallet = this.palletTypes.find(p => p.type_code === this.selectedPalletType)
      return pallet ? pallet.price : 0
    },
    selectedPalletTypeName() {
      const pallet = this.palletTypes.find(p => p.type_code === this.selectedPalletType)
      return pallet ? pallet.name : ''
    },
    selectedPalletDimensions() {
      const pallet = this.palletTypes.find(p => p.type_code === this.selectedPalletType)
      return pallet ? pallet.dimensions : ''
    },
    serviceCost() {
      if (!this.selectedService) return 0
      return (this.servicePricePerUnit + this.palletPrice) * this.palletCount
    },
    deliveryCost() {
      return this.deliveryMethod === 'delivery' ? 3500 : 0
    },
    totalCost() {
      return this.serviceCost + this.deliveryCost
    },
    isServiceSelected() {
      return this.selectedService !== null && this.palletCount >= 1 && this.selectedPalletType !== null
    },
    isDeliveryValid() {
      if (this.deliveryMethod === 'delivery' && !this.deliveryAddress.trim()) return false
      return true
    },
    presetSizes() {
      return [
        { name: '1200×800×145', length: 1200, width: 800, height: 145 },
        { name: '1200×800×120', length: 1200, width: 800, height: 120 },
        { name: '1300×1000×135', length: 1300, width: 1000, height: 135 },
        { name: '1400×1000×140', length: 1400, width: 1000, height: 140 }
      ]
    },
    selectedServiceId() {
      const serviceIdMap = {
        'processing': 1,
        'repair': 2,
        'overhaul': 3,
        'restoration': 4,
        'loading': 5,
        'wash': 1,
        'antiseptic': 1,
        'complex': 1
      }
      return serviceIdMap[this.selectedService] || 1
    }
  },
  mounted() {
    this.user = JSON.parse(localStorage.getItem('user'))
    if (!this.user) {
      this.$router.push('/login')
      return
    }
    
    this.loadPalletTypes()
  },
  beforeDestroy() {
    this.dispose3D()
  },
  methods: {
    async loadPalletTypes() {
      this.loadingPalletTypes = true
      try {
        const response = await axios.get(`${API_URL}/api/pallet-types`)
        this.palletTypes = response.data
        console.log('Загружено типов паллет:', this.palletTypes.length)
        
        await this.$nextTick()
        
        setTimeout(() => {
          this.init3DModel()
        }, 500)
      } catch (error) {
        console.error('Ошибка загрузки типов паллет:', error)
        this.palletTypes = [
          { id: 1, type_code: 'euro1', name: 'Европаллета 1 сорт', dimensions: '1200×800×145', price: 800, max_load_weight: 1500 },
          { id: 2, type_code: 'euro2', name: 'Европаллета 2 сорт', dimensions: '1200×800×145', price: 600, max_load_weight: 1200 },
          { id: 3, type_code: 'standard1', name: 'Стандартная 1 сорт', dimensions: '1200×800×145', price: 700, max_load_weight: 1000 },
          { id: 4, type_code: 'standard2', name: 'Стандартная 2 сорт', dimensions: '1200×800×145', price: 500, max_load_weight: 800 },
          { id: 5, type_code: 'thin', name: 'Тонкая паллета', dimensions: '1200×800×120', price: 400, max_load_weight: 600 },
          { id: 6, type_code: 'industrial', name: 'Индустриальная', dimensions: '1300×1000×135', price: 1200, max_load_weight: 2000 },
          { id: 7, type_code: 'large', name: 'Крупногабаритная', dimensions: '1400×1000×140', price: 1500, max_load_weight: 2500 }
        ]
        await this.$nextTick()
        setTimeout(() => {
          this.init3DModel()
        }, 500)
      } finally {
        this.loadingPalletTypes = false
      }
    },
    
    init3DModel() {
      if (this.modelInitialized) {
        console.log('Модель уже инициализирована')
        return
      }
      
      const container = document.getElementById('model-container')
      if (!container) {
        this.initAttempts++
        if (this.initAttempts < 10) {
          console.log(`Контейнер не найден, попытка ${this.initAttempts}/10`)
          setTimeout(() => this.init3DModel(), 500)
        } else {
          console.error('Не удалось найти контейнер после 10 попыток')
        }
        return
      }
      
      this.initAttempts = 0
      
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
      
      const width = container.clientWidth || 800
      const height = 400
      
      try {
        scene = new THREE.Scene()
        scene.background = new THREE.Color(0xE2D4C2)
        
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
        camera.position.set(3, 2, 4)
        camera.lookAt(0, 0.5, 0)
        
        renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.shadowMap.enabled = true
        container.appendChild(renderer.domElement)
        
        controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.05
        controls.autoRotate = true
        controls.autoRotateSpeed = 1.5
        controls.enableZoom = true
        controls.enablePan = true
        controls.target.set(0, 0.5, 0)
        
        const ambientLight = new THREE.AmbientLight(0x606060)
        scene.add(ambientLight)
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 1)
        mainLight.position.set(2, 3, 2)
        mainLight.castShadow = true
        scene.add(mainLight)
        
        const fillLight = new THREE.DirectionalLight(0xffaa66, 0.5)
        fillLight.position.set(-1, 2, 1)
        scene.add(fillLight)
        
        const backLight = new THREE.DirectionalLight(0x88aaff, 0.4)
        backLight.position.set(0, 1, -2)
        scene.add(backLight)
        
        const gridHelper = new THREE.GridHelper(6, 20, 0x91695D, 0xC5907F)
        gridHelper.position.y = -0.3
        scene.add(gridHelper)
        
        this.startAnimation()
        this.loadModelFromAPI(this.selectedPalletType)
        
        const handleResize = () => {
          if (!container || !camera || !renderer) return
          const newWidth = container.clientWidth
          const newHeight = 400
          if (newWidth > 0) {
            camera.aspect = newWidth / newHeight
            camera.updateProjectionMatrix()
            renderer.setSize(newWidth, newHeight)
          }
        }
        
        window.addEventListener('resize', handleResize)
        this._resizeHandler = handleResize
        this.modelInitialized = true
        
        console.log('3D сцена успешно инициализирована')
      } catch (error) {
        console.error('Ошибка при инициализации 3D сцены:', error)
      }
    },
    
    async loadModelFromAPI(typeCode) {
      if (!typeCode) {
        console.log('Нет типа паллеты для загрузки модели')
        return
      }
      
      if (this.modelCache.has(typeCode)) {
        console.log(`Используем кешированную модель для ${typeCode}`)
        if (currentModel && scene) {
          scene.remove(currentModel)
        }
        const cachedModel = this.modelCache.get(typeCode)
        currentModel = cachedModel.clone()
        if (scene) {
          scene.add(currentModel)
          this.applyModelTransform(currentModel, typeCode)
        }
        return
      }
      
      this.modelLoading = true
      this.modelError = false
      console.log(`Загрузка модели для типа: ${typeCode}`)
      
      try {
        const response = await axios.get(`${API_URL}/api/pallet-model/${typeCode}`, {
          responseType: 'arraybuffer',
          timeout: 10000
        })
        
        if (response.data && response.data.byteLength > 0 && scene) {
          const blob = new Blob([response.data], { type: 'model/gltf-binary' })
          const url = URL.createObjectURL(blob)
          
          const loader = new GLTFLoader()
          loader.load(url,
            (gltf) => {
              console.log(`Модель для ${typeCode} успешно загружена!`)
              
              if (currentModel && scene) {
                scene.remove(currentModel)
              }
              
              currentModel = gltf.scene
              this.modelCache.set(typeCode, currentModel.clone())
              if (scene) {
                scene.add(currentModel)
                this.applyModelTransform(currentModel, typeCode)
              }
              
              URL.revokeObjectURL(url)
              this.modelLoading = false
              this.modelError = false
            },
            (progress) => {
              const percent = Math.round((progress.loaded / progress.total) * 100)
              if (percent % 20 === 0) {
                console.log(`Загрузка модели ${typeCode}: ${percent}%`)
              }
            },
            (error) => {
              console.error(`Ошибка загрузки модели для ${typeCode}:`, error)
              URL.revokeObjectURL(url)
              this.modelLoading = false
              this.modelError = true
              this.createFallbackModel(typeCode)
            }
          )
        } else {
          throw new Error('Пустой ответ от сервера')
        }
      } catch (error) {
        console.error(`Не удалось загрузить модель для ${typeCode}:`, error.message)
        this.modelLoading = false
        this.modelError = true
        this.createFallbackModel(typeCode)
      }
    },
    
    applyModelTransform(model, typeCode) {
      if (!model) return
      
      try {
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        
        const targetSize = 1.2
        const maxDimension = Math.max(size.x, size.y, size.z)
        
        if (maxDimension === 0) {
          console.warn('Модель имеет нулевой размер')
          return
        }
        
        let scale = targetSize / maxDimension
        
        const corrections = {
          'industrial': 0.9,
          'large': 0.85,
          'thin': 1.1
        }
        scale = scale * (corrections[typeCode] || 1.0)
        
        model.scale.set(scale, scale, scale)
        
        model.updateMatrixWorld()
        const newBox = new THREE.Box3().setFromObject(model)
        const newCenter = newBox.getCenter(new THREE.Vector3())
        const newSize = newBox.getSize(new THREE.Vector3())
        
        model.position.x = -newCenter.x
        model.position.z = -newCenter.z
        model.position.y = -newCenter.y + (newSize.y / 2)
        
        if (controls) {
          controls.target.set(0, newSize.y / 2, 0)
          controls.update()
        }
      } catch (error) {
        console.error('Ошибка при трансформации модели:', error)
      }
    },
    
    createFallbackModel(typeCode) {
      if (!scene) {
        console.log('Сцена не инициализирована, пропускаем создание fallback модели')
        return
      }
      
      console.log('Создание резервной 3D модели (fallback)')
      
      if (currentModel && scene) {
        scene.remove(currentModel)
      }
      
      const group = new THREE.Group()
      const woodMaterial = new THREE.MeshStandardMaterial({ color: 0xBD8A3A, roughness: 0.4, metalness: 0.1 })
      const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.6 })
      
      let width = 1.2, depth = 0.8, height = 0.145
      if (typeCode === 'industrial') { width = 1.3; depth = 1.0; height = 0.135 }
      if (typeCode === 'large') { width = 1.4; depth = 1.0; height = 0.14 }
      if (typeCode === 'thin') { height = 0.12 }
      
      const platform = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, depth), woodMaterial)
      platform.position.y = 0
      platform.castShadow = true
      platform.receiveShadow = true
      group.add(platform)
      
      const boardCount = 5
      for (let i = 0; i < boardCount; i++) {
        const zPos = -depth/2 + (i + 0.5) * (depth / boardCount)
        const board = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.03, 0.12), woodMaterial)
        board.position.set(0, 0.04, zPos)
        board.castShadow = true
        group.add(board)
      }
      
      const legPositions = [
        [-width/2 + 0.1, -0.08, -depth/2 + 0.1],
        [width/2 - 0.1, -0.08, -depth/2 + 0.1],
        [-width/2 + 0.1, -0.08, depth/2 - 0.1],
        [width/2 - 0.1, -0.08, depth/2 - 0.1]
      ]
      
      legPositions.forEach(pos => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), darkMaterial)
        leg.position.set(pos[0], pos[1], pos[2])
        leg.castShadow = true
        group.add(leg)
      })
      
      scene.add(group)
      currentModel = group
      this.applyModelTransform(group, typeCode)
    },
    
    startAnimation() {
      const animate = () => {
        if (!renderer || !scene || !camera) {
          return
        }
        
        animationId = requestAnimationFrame(animate)
        
        if (controls) {
          controls.update()
        }
        
        renderer.render(scene, camera)
      }
      
      animate()
    },
    
    dispose3D() {
      if (animationId) {
        cancelAnimationFrame(animationId)
        animationId = null
      }
      
      if (controls) {
        controls.dispose()
        controls = null
      }
      
      if (renderer) {
        renderer.dispose()
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement)
        }
        renderer = null
      }
      
      if (scene) {
        scene.clear()
        scene = null
      }
      
      camera = null
      currentModel = null
      
      if (this._resizeHandler) {
        window.removeEventListener('resize', this._resizeHandler)
        this._resizeHandler = null
      }
      
      this.modelInitialized = false
    },
    
    onServiceChange() {},
    
    selectPalletType(typeCode) {
      this.selectedPalletType = typeCode
      this.recommendedPallet = null
      this.loadResult = null
      
      if (this.modelInitialized && scene) {
        this.loadModelFromAPI(typeCode)
      }
    },
    
    toggleCategory(categoryId) {
      this.expandedCategory = this.expandedCategory === categoryId ? null : categoryId
    },
    
    validatePalletCount() {
      if (this.palletCount < 1) this.palletCount = 1
      if (this.palletCount > 1000) this.palletCount = 1000
    },
    
    formatPrice(price) {
      return new Intl.NumberFormat('ru-RU').format(price)
    },
    
    formatLoadNumber(value) {
      return new Intl.NumberFormat('ru-RU').format(Math.round(value))
    },
    
    async findMatchingPallet() {
      if (!this.customLength || !this.customWidth || !this.customHeight) {
        alert('Пожалуйста, заполните все размеры')
        return
      }
      
      this.calculating = true
      try {
        const response = await axios.post(`${API_URL}/api/pallets/recommend`, {
          length: this.customLength,
          width: this.customWidth,
          height: this.customHeight
        })
        
        if (response.data.found) {
          this.recommendedPallet = response.data.pallet
        } else {
          this.recommendedPallet = null
          alert('Не найдено подходящего паллета')
        }
      } catch (error) {
        console.error('Ошибка поиска:', error)
        alert('Ошибка при поиске паллета')
      } finally {
        this.calculating = false
      }
    },
    
    applyPreset(preset) {
      this.customLength = preset.length
      this.customWidth = preset.width
      this.customHeight = preset.height
      this.findMatchingPallet()
    },
    
    selectRecommendedPallet() {
      if (this.recommendedPallet) {
        this.selectedPalletType = this.recommendedPallet.type_code
        this.recommendedPallet = null
        if (this.modelInitialized && scene) {
          this.loadModelFromAPI(this.selectedPalletType)
        }
      }
    },
    
    async calculateLoad() {
      if (!this.loadWeight || this.loadWeight <= 0) {
        alert('Пожалуйста, введите вес груза')
        return
      }
      
      if (!this.selectedPalletType) {
        alert('Пожалуйста, выберите тип паллеты')
        return
      }
      
      this.calculatingLoad = true
      this.loadResult = null
      
      try {
        const response = await axios.post(`${API_URL}/api/pallets/calculate-load`, {
          weight: this.loadWeight,
          pallet_type_code: this.selectedPalletType,
          load_type: this.loadType,
          conditions: this.loadConditions
        })
        
        if (response.data.success) {
          this.loadResult = response.data.data
        } else {
          alert('Ошибка при расчете нагрузки')
        }
      } catch (error) {
        console.error('Ошибка расчета нагрузки:', error)
        this.calculateLoadLocally()
      } finally {
        this.calculatingLoad = false
      }
    },
    
    calculateLoadLocally() {
      const pallet = this.palletTypes.find(p => p.type_code === this.selectedPalletType)
      if (!pallet) {
        alert('Тип паллеты не найден')
        return
      }
      
      const P_base = pallet.max_load_weight || 1500
      
      const distributionFactor = {
        uniform: 1.0,
        point: 0.7
      }
      const K_distribution = distributionFactor[this.loadType] || 1.0
      
      const conditionsFactor = {
        dry: 1.0,
        wet: 0.8,
        aggressive: 0.6
      }
      const K_conditions = conditionsFactor[this.loadConditions] || 1.0
      
      const P_allowed = P_base * K_distribution * K_conditions
      const weight = this.loadWeight
      
      let status = ''
      let conclusion = ''
      let recommendation = ''
      const safetyMargin = ((P_allowed - weight) / P_allowed * 100)
      
      if (weight <= P_allowed) {
        status = 'success'
        conclusion = `Паллета "${pallet.name}" выдерживает заданную нагрузку`
        
        if (safetyMargin > 30) {
          recommendation = 'Паллета имеет значительный запас прочности, можно использовать для более тяжелых грузов'
        } else if (safetyMargin > 10) {
          recommendation = 'Паллета надежна, рекомендуется соблюдать условия эксплуатации'
        } else {
          recommendation = 'Паллета выдерживает нагрузку, но запас прочности минимален'
        }
      } else {
        status = 'danger'
        conclusion = `Паллета "${pallet.name}" НЕ выдерживает заданную нагрузку`
        const overloadPercent = ((weight - P_allowed) / P_allowed * 100)
        
        if (overloadPercent > 50) {
          recommendation = 'Критическая перегрузка! Требуется усиление конструкции или использование нескольких паллет'
        } else if (overloadPercent > 20) {
          recommendation = 'Существенная перегрузка. Рекомендуется ремонт, усиление или замена паллеты'
        } else {
          recommendation = 'Небольшая перегрузка. Возможно временное использование, но рекомендуется усиление'
        }
      }
      
      this.loadResult = {
        success: status === 'success',
        status: status,
        conclusion: conclusion,
        recommendation: recommendation,
        pallet_name: pallet.name,
        calculations: {
          base_load: P_base,
          distribution_factor: K_distribution,
          conditions_factor: K_conditions,
          allowed_load: Math.round(P_allowed),
          actual_load: weight,
          safety_margin: parseFloat(safetyMargin.toFixed(1)),
          load_percent: Math.round((weight / P_allowed) * 100)
        }
      }
    },
    
    nextStep() {
      if (this.currentStep === 1 && !this.isServiceSelected) {
        alert('Пожалуйста, выберите услугу, тип паллет и количество')
        return
      }
      if (this.currentStep === 2 && !this.isDeliveryValid) {
        if (this.deliveryMethod === 'delivery' && !this.deliveryAddress) alert('Укажите адрес')
        return
      }
      if (this.currentStep < 3) {
        this.currentStep++
      }
    },
    
    prevStep() {
      if (this.currentStep > 1) {
        this.currentStep--
      }
    },
    
    async createRequest() {
      if (!this.isDeliveryValid) {
        alert('Заполните все поля')
        return
      }
      
      this.submitting = true
      
      const requestData = {
        client_id: this.user.id,
        service_id: this.selectedServiceId,
        description: this.comment || 'Без комментариев',
        pallet_quantity: this.palletCount,
        pallet_type_code: this.selectedPalletType,
        pallet_dimensions: this.selectedPalletDimensions,
        total_cost: this.totalCost
      }
      
      console.log('Отправка данных заявки:', requestData)
      
      try {
        const response = await axios.post(`${API_URL}/api/requests`, requestData)
        console.log('Ответ сервера:', response.data)
        
        if (response.data.success || response.data.request_id) {
          alert(`Заявка успешно создана!\nНомер: ${response.data.request_number}\nСумма: ${this.formatPrice(this.totalCost)} руб.`)
          this.$router.push('/my-requests')
        } else {
          alert('Ошибка: ' + (response.data.error || 'Неизвестная ошибка'))
        }
      } catch (error) {
        console.error('Ошибка создания заявки:', error)
        const errorMsg = error.response?.data?.error || error.message || 'Ошибка соединения с сервером'
        alert('Ошибка создания заявки: ' + errorMsg)
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.create-request {
  background-color: #E2D4C2;
  min-height: 100vh;
  padding: 40px 20px;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.request-card {
  background: #F2E9DE;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(94, 66, 57, 0.15);
  overflow: hidden;
}

.steps {
  display: flex;
  background: #D4C4B0;
  border-bottom: 1px solid #A97B6C;
  padding: 20px 30px;
  gap: 20px;
}

.step-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #7D574B;
  padding-bottom: 10px;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.step-item.active {
  color: #5E4239;
  border-bottom-color: #5E4239;
}

.step-number {
  width: 32px;
  height: 32px;
  background: #F2E9DE;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #63483F;
}

.step-item.active .step-number {
  background: #5E4239;
  color: #F2E9DE;
}

.step-pane {
  padding: 30px;
  background: #F2E9DE;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-title {
  margin-bottom: 25px;
  color: #5E4239;
  font-size: 1.5rem;
  font-weight: 700;
}

.services-categories {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 25px;
}

.category-item {
  border: 2px solid #C5907F;
  border-radius: 12px;
  overflow: hidden;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #E2D4C2;
  cursor: pointer;
  transition: background 0.2s;
}

.category-header:hover {
  background: #D4C4B0;
}

.category-name {
  font-weight: 700;
  color: #5E4239;
}

.category-price {
  font-size: 0.9rem;
  color: #91695D;
}

.subservices-list,
.simple-service {
  padding: 15px 20px;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.subservice-item,
.service-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border: 2px solid #C5907F;
  border-radius: 10px;
  cursor: pointer;
  background: #F2E9DE;
  transition: all 0.2s;
}

.subservice-item.selected,
.service-item.selected {
  border-color: #5E4239;
  background: #C5907F;
}

.subservice-item input,
.service-item input {
  margin-right: 12px;
}

.subservice-info,
.service-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
}

.calculator-wrapper {
  border: 2px solid #C5907F;
  border-radius: 12px;
  padding: 20px;
  background: #FFFFFF;
}

.size-inputs-group {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.size-input-wrapper {
  flex: 1;
  min-width: 100px;
}

.size-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #63483F;
  margin-bottom: 5px;
}

.size-input-field {
  width: 100%;
  padding: 10px;
  border: 2px solid #C5907F;
  border-radius: 10px;
  background: #F2E9DE;
}

.btn-find {
  background: #5E4239;
  color: #F2E9DE;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  height: 42px;
  white-space: nowrap;
}

.btn-find:disabled {
  background: #A97B6C;
  cursor: not-allowed;
}

.quick-sizes {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  padding-top: 15px;
  border-top: 1px solid #C5907F;
}

.quick-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #63483F;
}

.quick-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-size-btn {
  background: #F2E9DE;
  border: 2px solid #91695D;
  color: #5E4239;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-size-btn:hover {
  background: #E2D4C2;
  transform: translateY(-1px);
}

.recommended-pallet {
  background: #E2D4C2;
  border: 2px solid #91695D;
  border-radius: 12px;
  padding: 15px;
  margin: 20px 0;
}

.recommended-content {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.recommended-icon {
  font-size: 2rem;
}

.recommended-text {
  flex: 1;
}

.recommended-title {
  font-size: 0.85rem;
  color: #6D4E44;
  margin-bottom: 5px;
}

.recommended-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: #5E4239;
}

.recommended-price {
  font-weight: 600;
  color: #91695D;
}

.btn-use-recommended {
  background: #5E4239;
  color: #F2E9DE;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-use-recommended:hover {
  background: #7D574B;
}

.pallet-types {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.pallet-type-card {
  border: 2px solid #C5907F;
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  background: #FFFFFF;
  transition: all 0.3s;
}

.pallet-type-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(94, 66, 57, 0.15);
}

.pallet-type-card.selected {
  border-color: #5E4239;
  background: #E2D4C2;
}

.pallet-type-name {
  font-weight: 700;
  color: #5E4239;
  margin-bottom: 5px;
}

.pallet-type-dimensions {
  font-size: 0.8rem;
  color: #91695D;
  margin-bottom: 5px;
}

.pallet-type-price {
  font-weight: 700;
  color: #5E4239;
}

.model-viewer {
  background: #FFFFFF;
  border-radius: 12px;
  border: 2px solid #C5907F;
  padding: 15px;
  margin-top: 20px;
}

.model-header {
  font-weight: 600;
  color: #5E4239;
  text-align: center;
  margin-bottom: 10px;
}

.model-status {
  font-size: 0.75rem;
  margin-left: 8px;
}

.model-status.error {
  color: #c62828;
}

.model-hint {
  text-align: center;
  font-size: 0.75rem;
  color: #91695D;
  margin-top: 10px;
}

.load-calculator {
  background: #FFFFFF;
  border-radius: 12px;
  border: 2px solid #C5907F;
  margin-top: 20px;
  overflow: hidden;
}

.load-calculator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #E2D4C2;
  cursor: pointer;
  font-weight: 700;
  color: #5E4239;
  transition: background 0.2s;
}

.load-calculator-header:hover {
  background: #D4C4B0;
}

.load-calculator-title {
  font-size: 1rem;
}

.load-calculator-content {
  padding: 20px;
}

.load-input-group {
  margin-bottom: 20px;
}

.load-input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #5E4239;
  font-size: 0.9rem;
}

.load-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #C5907F;
  border-radius: 10px;
  background: #F2E9DE;
  font-size: 1rem;
}

.load-type-buttons,
.conditions-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.load-type-btn,
.condition-btn {
  flex: 1;
  min-width: 100px;
  padding: 10px 15px;
  background: #F2E9DE;
  border: 2px solid #C5907F;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.load-type-btn.active,
.condition-btn.active {
  background: #5E4239;
  border-color: #5E4239;
  color: #F2E9DE;
}

.load-type-btn:hover,
.condition-btn:hover {
  background: #E2D4C2;
  transform: translateY(-1px);
}

.btn-calculate-load {
  width: 100%;
  padding: 12px;
  background: #5E4239;
  color: #F2E9DE;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.3s;
}

.btn-calculate-load:hover {
  background: #7D574B;
}

.btn-calculate-load:disabled {
  background: #A97B6C;
  cursor: not-allowed;
}

.load-result {
  margin-top: 20px;
  border-radius: 12px;
  overflow: hidden;
  animation: fadeIn 0.3s ease;
}

.load-result-header {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
}

.load-result-header.success {
  background: #d4edda;
  color: #155724;
  border-bottom: 2px solid #28a745;
}

.load-result-header.danger {
  background: #f8d7da;
  color: #721c24;
  border-bottom: 2px solid #dc3545;
}

.result-icon {
  font-size: 1.5rem;
}

.result-conclusion {
  font-size: 1rem;
}

.load-result-details {
  padding: 15px 20px;
  background: #F2E9DE;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 0.9rem;
}

.detail-row strong {
  font-weight: 700;
  color: #5E4239;
}

.load-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 200px;
}

.load-progress-bar {
  height: 8px;
  background: #C5907F;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-success {
  background: #28a745;
}

.progress-warning {
  background: #ffc107;
}

.progress-danger {
  background: #dc3545;
}

.load-percent {
  min-width: 45px;
  font-size: 0.85rem;
  font-weight: 600;
}

.text-danger {
  color: #dc3545;
}

.recommendation {
  margin-top: 5px;
  padding-top: 10px;
  border-top: 1px solid #C5907F;
  background: #E2D4C2;
  margin: 5px -20px -15px -20px;
  padding: 12px 20px;
  border-radius: 0 0 12px 12px;
}

.recommendation span:first-child {
  font-weight: 600;
}

.recommendation span:last-child {
  flex: 1;
  text-align: left;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #5E4239;
}

.quantity-input,
.address-input,
.comment-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #C5907F;
  border-radius: 10px;
  background: #F2E9DE;
}

.order-summary {
  background: #E2D4C2;
  border-radius: 12px;
  padding: 20px;
  margin: 25px 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  color: #5E4239;
}

.summary-row.total {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 2px solid #A97B6C;
  font-weight: 700;
  font-size: 1.2rem;
}

.delivery-options {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
}

.delivery-item {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 15px;
  border: 2px solid #C5907F;
  background: #F2E9DE;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.delivery-item.selected {
  border-color: #5E4239;
  background: #C5907F;
}

.delivery-item input {
  margin-right: 12px;
}

.delivery-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
}

.confirm-block {
  background: #E2D4C2;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
}

.confirm-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #A97B6C;
}

.confirm-row.total {
  border-top: 2px solid #91695D;
  font-weight: 700;
  margin-top: 10px;
  padding-top: 15px;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  gap: 15px;
}

.btn {
  padding: 12px 30px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #5E4239;
  color: #F2E9DE;
}

.btn-primary:disabled {
  background: #A97B6C;
  cursor: not-allowed;
}

.btn-secondary {
  background: #C5907F;
  color: #F2E9DE;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #91695D;
}

@media (max-width: 768px) {
  .pallet-types {
    grid-template-columns: 1fr;
  }
  
  .steps {
    padding: 15px;
    gap: 10px;
  }
  
  .step-item span:last-child {
    font-size: 0.9rem;
  }
  
  .step-pane {
    padding: 20px;
  }
  
  .delivery-options {
    flex-direction: column;
  }
  
  .confirm-row {
    flex-direction: column;
    gap: 5px;
  }
  
  .size-inputs-group {
    flex-direction: column;
  }
  
  .btn-find {
    width: 100%;
  }
  
  .quick-sizes {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .load-type-buttons,
  .conditions-buttons {
    flex-direction: column;
  }
  
  .load-type-btn,
  .condition-btn {
    width: 100%;
  }
  
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .load-progress {
    width: 100%;
  }
}
</style>