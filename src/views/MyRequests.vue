<template>
  <div class="my-requests">
    <div class="container">
      <div class="requests-card">
        <h2>Мои заявки</h2>
        
        <div v-if="loading" class="loading-spinner">
          <div class="spinner"></div>
          <p>Загрузка заявок...</p>
        </div>
        
        <div v-else-if="requests.length === 0" class="no-requests">
          <p>У вас пока нет заявок</p>
          <router-link to="/request" class="btn">Создать первую заявку</router-link>
        </div>
        
        <div v-else class="requests-list">
          <div v-for="request in requests" :key="request.id" class="request-item">
            <div class="request-header">
              <h3>Заявка #{{ request.request_number || request.id }}</h3>
              <span class="service-name">{{ request.service_name }}</span>
              <span :class="'status status-' + request.status">
                {{ getStatusText(request.status) }}
              </span>
            </div>
            
            <div class="request-details">
              <div class="detail-row">
                <span class="detail-label">Описание:</span>
                <span class="detail-value">{{ request.description || 'Нет описания' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Дата создания:</span>
                <span class="detail-value">{{ formatDate(request.created_at) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Стоимость:</span>
                <span class="detail-value">{{ request.total_cost ? formatPrice(request.total_cost) + ' руб.' : 'Не рассчитана' }}</span>
              </div>
              <div v-if="request.manager_comment" class="detail-row">
                <span class="detail-label">Комментарий менеджера:</span>
                <span class="detail-value">{{ request.manager_comment }}</span>
              </div>
              <div v-if="request.actual_start_date" class="detail-row">
                <span class="detail-label">Дата начала работ:</span>
                <span class="detail-value">{{ formatDate(request.actual_start_date) }}</span>
              </div>
              <div v-if="request.actual_end_date" class="detail-row">
                <span class="detail-label">Дата завершения:</span>
                <span class="detail-value">{{ formatDate(request.actual_end_date) }}</span>
              </div>
              
              <div class="request-actions">
                <button @click="viewPallets(request)" class="btn-pallets">
                  📦 Паллеты ({{ getPalletsCount(request.id) }})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Модальное окно с паллетами -->
      <div v-if="showPalletModal" class="modal" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Паллеты в заявке #{{ selectedRequestId }}</h3>
            <span class="close" @click="closeModal">&times;</span>
          </div>
          <PalletsManage :request-id="selectedRequestId" @pallets-loaded="onPalletsLoaded" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import socketService from '../plugins/socket.js'
import PalletsManage from './PalletsManage.vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default {
  name: 'MyRequests',
  components: {
    PalletsManage
  },
  data() {
    return {
      requests: [],
      palletsCount: {},
      showPalletModal: false,
      selectedRequestId: null,
      user: null,
      loading: true,
      loadingPallets: {}
    }
  },
  mounted() {
    this.user = JSON.parse(localStorage.getItem('user'))
    if (!this.user) {
      this.$router.push('/login')
      return
    }
    this.loadRequests()
    this.setupSocketListeners()
  },
  beforeUnmount() {
    socketService.off('request_update')
    socketService.off('pallet_update')
    socketService.off('connect')
    socketService.off('disconnect')
  },
  methods: {
    setupSocketListeners() {
      socketService.on('connect', () => {
        console.log('Socket.IO подключен в MyRequests')
      })
      
      socketService.on('disconnect', () => {
        console.log('Socket.IO отключен в MyRequests')
      })
      
      socketService.on('request_update', (data) => {
        console.log('Получено обновление заявки:', data)
        this.loadRequests()
      })
      
      socketService.on('pallet_update', (data) => {
        console.log('Получено обновление паллеты:', data)
        if (data.request_id) {
          this.loadPalletsCountForRequest(data.request_id)
          this.showNotification(`Паллета ${data.pallet_code}: статус изменен`)
        }
      })
    },
    
    async loadRequests() {
      this.loading = true
      try {
        const response = await axios.get(`${API_URL}/api/client/requests/${this.user.id}`)
        this.requests = response.data
        
        // Инициализируем счетчики нулями
        for (const request of this.requests) {
          this.palletsCount[request.id] = 0
        }
        
        await this.loadAllPalletsCounts()
      } catch (error) {
        console.error('Ошибка загрузки заявок:', error)
      } finally {
        this.loading = false
      }
    },
    
    async loadAllPalletsCounts() {
      const promises = this.requests.map(request => 
        this.loadPalletsCountForRequest(request.id)
      )
      await Promise.all(promises)
    },
    
    async loadPalletsCountForRequest(requestId) {
      if (this.loadingPallets[requestId]) return
      
      this.loadingPallets[requestId] = true
      try {
        const response = await axios.get(`${API_URL}/api/requests/${requestId}/pallets`)
        const count = response.data.length
        // В Vue 3 можно просто присвоить значение
        this.palletsCount[requestId] = count
        console.log(`Заявка ${requestId}: ${count} паллет`)
      } catch (error) {
        console.error(`Ошибка загрузки паллет для заявки ${requestId}:`, error)
        this.palletsCount[requestId] = 0
      } finally {
        this.loadingPallets[requestId] = false
      }
    },
    
    getPalletsCount(requestId) {
      const count = this.palletsCount[requestId]
      return count !== undefined && count !== null ? count : 0
    },
    
    onPalletsLoaded(data) {
      if (data && data.requestId && data.count !== undefined) {
        this.palletsCount[data.requestId] = data.count
        console.log(`Обновлен счетчик из события для заявки ${data.requestId}: ${data.count}`)
      }
    },
    
    viewPallets(request) {
      this.selectedRequestId = request.id
      this.showPalletModal = true
    },
    
    closeModal() {
      this.showPalletModal = false
      if (this.selectedRequestId) {
        this.loadPalletsCountForRequest(this.selectedRequestId)
      }
      this.selectedRequestId = null
    },
    
    showNotification(message) {
      const notification = document.createElement('div')
      notification.className = 'socket-notification'
      notification.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon">🔔</span>
          <span class="notification-message">${message}</span>
        </div>
      `
      document.body.appendChild(notification)
      
      setTimeout(() => {
        notification.classList.add('fade-out')
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 300)
      }, 3000)
    },
    
    getStatusText(status) {
      const statusMap = {
        'new': 'Новая',
        'in_work': 'В работе',
        'completed': 'Выполнена',
        'cancelled': 'Отменена'
      }
      return statusMap[status] || status
    },
    
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    formatPrice(price) {
      return new Intl.NumberFormat('ru-RU').format(price)
    }
  }
}
</script>

<style scoped>
.my-requests {
  background-color: #E2D4C2;
  min-height: 100vh;
  padding: 40px 20px;
}

.container {
  max-width: 900px;
  margin: 0 auto;
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

.requests-card {
  background: #F2E9DE;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(94, 66, 57, 0.15);
  overflow: hidden;
  padding: 30px;
}

.requests-card h2 {
  color: #5E4239;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 25px;
  text-align: center;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.request-item {
  background: #FFFFFF;
  border: 2px solid #C5907F;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s;
}

.request-item:hover {
  border-color: #5E4239;
  box-shadow: 0 5px 20px rgba(94, 66, 57, 0.15);
  transform: translateY(-2px);
}

.request-header {
  background: #E2D4C2;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.request-header h3 {
  color: #5E4239;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
}

.service-name {
  background: #91695D;
  color: #F2E9DE;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-left: auto;
}

.status-new {
  background: #ffc107;
  color: #333;
}

.status-in_work {
  background: #5E4239;
  color: white;
}

.status-completed {
  background: #28a745;
  color: white;
}

.status-cancelled {
  background: #dc3545;
  color: white;
}

.request-details {
  padding: 20px;
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #F2E9DE;
}

.detail-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.detail-label {
  font-weight: 700;
  color: #5E4239;
  min-width: 160px;
  font-size: 0.9rem;
}

.detail-value {
  color: #6D4E44;
  flex: 1;
  font-size: 0.9rem;
  word-break: break-word;
}

.request-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.btn-pallets {
  background: #5E4239;
  color: #F2E9DE;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-pallets:hover {
  background: #6D4E44;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(94, 66, 57, 0.3);
}

.no-requests {
  text-align: center;
  padding: 60px 20px;
}

.no-requests p {
  color: #91695D;
  font-size: 1.1rem;
  margin-bottom: 20px;
}

.btn {
  background: #5E4239;
  color: #F2E9DE;
  border: none;
  padding: 12px 30px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s;
}

.btn:hover {
  background: #6D4E44;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(94, 66, 57, 0.3);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #F2E9DE;
  border-radius: 20px;
  max-width: 800px;
  width: 90%;
  max-height: 80%;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background: #E2D4C2;
  border-radius: 20px 20px 0 0;
}

.modal-header h3 {
  color: #5E4239;
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0;
}

.close {
  font-size: 32px;
  font-weight: bold;
  color: #91695D;
  cursor: pointer;
  transition: all 0.3s;
  line-height: 1;
}

.close:hover {
  color: #5E4239;
  transform: scale(1.1);
}

.socket-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1100;
  animation: slideInRight 0.3s ease;
}

.socket-notification .notification-content {
  background: #5E4239;
  color: #F2E9DE;
  padding: 12px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.socket-notification .notification-icon {
  font-size: 1.2rem;
}

.socket-notification .notification-message {
  font-size: 0.9rem;
}

.socket-notification.fade-out {
  animation: fadeOut 0.3s ease forwards;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

@media (max-width: 768px) {
  .my-requests {
    padding: 20px;
  }
  
  .requests-card {
    padding: 20px;
  }
  
  .requests-card h2 {
    font-size: 1.5rem;
  }
  
  .request-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .status {
    margin-left: 0;
  }
  
  .detail-row {
    flex-direction: column;
  }
  
  .detail-label {
    min-width: auto;
    margin-bottom: 5px;
  }
  
  .detail-value {
    padding-left: 0;
  }
  
  .modal-content {
    width: 95%;
    max-height: 85%;
  }
  
  .modal-header h3 {
    font-size: 1.1rem;
  }
  
  .socket-notification {
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
}
</style>