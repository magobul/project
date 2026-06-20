<template>
  <div class="pallet-manager">
    <h3>Паллеты в заявке #{{ requestId }}</h3>
    
    <div class="pallets-stats" v-if="pallets.length > 0">
      <div class="stat-badge">
        <span>📦 Всего: {{ pallets.length }}</span>
        <span>✅ На складе: {{ stats.in_stock }}</span>
        <span>🔧 В ремонте: {{ stats.in_repair }}</span>
        <span>🚚 В пути: {{ stats.in_transit }}</span>
        <span>📤 Передано: {{ stats.transferred }}</span>
        <span>❌ Списано: {{ stats.written_off }}</span>
      </div>
    </div>
    
    <div class="pallets-list" v-if="pallets.length > 0">
      <div v-for="pallet in pallets" :key="pallet.id" class="pallet-card">
        <div class="pallet-info">
          <div class="pallet-code"><strong>Код:</strong> {{ pallet.pallet_code }}</div>
          <div><strong>Тип:</strong> {{ getPalletTypeName(pallet.type) }}</div>
          <div v-if="pallet.dimensions"><strong>Размеры:</strong> {{ pallet.dimensions }}</div>
          <div><strong>Материал:</strong> {{ pallet.material }}</div>
          <div><strong>Статус:</strong> 
            <span :class="'status-' + pallet.status">
              {{ getPalletStatusName(pallet.status) }}
            </span>
          </div>
        </div>
        
        <div class="pallet-actions" v-if="isAdmin">
          <label>Изменить статус:</label>
          <select v-model="pallet.status" @change="updateStatus(pallet)">
            <option value="in_stock">📦 На складе</option>
            <option value="in_repair">🔧 В ремонте</option>
            <option value="in_transit">🚚 В пути</option>
            <option value="transferred">📤 Передана клиенту</option>
            <option value="written_off">❌ Списана</option>
          </select>
        </div>
        
        <div class="pallet-timestamps" v-if="!isAdmin">
          <small>Создана: {{ formatDate(pallet.created_at) }}</small>
          <small v-if="pallet.status_updated_at !== pallet.created_at">
            Статус изменен: {{ formatDate(pallet.status_updated_at) }}
          </small>
        </div>
      </div>
    </div>
    
    <div class="no-pallets" v-else>
      <p>Нет паллет для этой заявки</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import socketService from '../plugins/socket.js'

export default {
  name: 'PalletsManage',
  props: {
    requestId: {
      type: [Number, String],
      required: true
    }
  },
  data() {
    return {
      pallets: [],
      isAdmin: false,
      updateInProgress: false
    }
  },
  computed: {
    stats() {
      const stats = {
        in_stock: 0,
        in_repair: 0,
        transferred: 0,
        in_transit: 0,
        written_off: 0
      }
      this.pallets.forEach(pallet => {
        if (stats[pallet.status] !== undefined) {
          stats[pallet.status]++
        }
      })
      return stats
    }
  },
  mounted() {
    // Проверяем, кто зашел - админ или клиент
    const manager = JSON.parse(localStorage.getItem('manager'))
    const user = JSON.parse(localStorage.getItem('user'))
    this.isAdmin = !!(manager || (user && (user.role === 'admin' || user.role === 'manager')))
    
    this.loadPallets()
    this.setupSocketListeners()
  },
  beforeUnmount() {
    socketService.off('pallet_update')
    socketService.off('request_update')
  },
  methods: {
    setupSocketListeners() {
      // Слушаем обновления паллет
      socketService.on('pallet_update', (data) => {
        console.log('Получено обновление паллеты в PalletsManage:', data)
        // Обновляем только если паллета относится к текущей заявке
        if (data.request_id == this.requestId) {
          this.loadPallets()
          this.showNotification(`Паллета ${data.pallet_code}: статус изменен на ${this.getPalletStatusName(data.status)}`)
        }
      })
      
      // Слушаем обновления заявок (для обновления паллет)
      socketService.on('request_update', (data) => {
        if (data.request_id == this.requestId && data.data?.updated_count) {
          this.loadPallets()
        }
      })
    },
    
    async loadPallets() {
      try {
        const response = await axios.get(`http://localhost:3000/api/requests/${this.requestId}/pallets`)
        this.pallets = response.data || []
        console.log('Загружено паллет:', this.pallets.length)
            // Отправляем событие о загрузке паллет в родительский компонент
            this.$emit('pallets-loaded', {
              requestId: this.requestId,
              count: this.pallets.length
            })
          } catch (error) {
            console.error('Ошибка загрузки паллет:', error)
            this.pallets = []
            this.$emit('pallets-loaded', {
              requestId: this.requestId,
              count: 0
            })
          }
        },
    
    async updateStatus(pallet) {
      if (this.updateInProgress) return
      
      this.updateInProgress = true
      try {
        await axios.put(`http://localhost:3000/api/pallets/${pallet.id}/status`, {
          status: pallet.status
        })
        // Сокет сам обновит данные, но для скорости перезагружаем
        await this.loadPallets()
        this.showNotification(`Статус паллеты ${pallet.pallet_code} изменен на ${this.getPalletStatusName(pallet.status)}`)
      } catch (error) {
        console.error('Ошибка обновления статуса:', error)
        alert('Ошибка: ' + (error.response?.data?.error || error.message))
        await this.loadPallets()
      } finally {
        this.updateInProgress = false
      }
    },
    
    showNotification(message) {
      // Создаем временное уведомление
      const notification = document.createElement('div')
      notification.className = 'pallet-notification'
      notification.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon">✅</span>
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
    
    getPalletTypeName(type) {
      const types = {
        'euro': 'Европаллет (1200x800)',
        'euro1': 'Европаллета 1 сорт',
        'euro2': 'Европаллета 2 сорт',
        'standard1': 'Стандартная 1 сорт',
        'standard2': 'Стандартная 2 сорт',
        'thin': 'Тонкая паллета',
        'industrial': 'Индустриальная',
        'large': 'Крупногабаритная',
        'fin': 'Финпаллет (1200x1000)',
        'other': 'Прочий'
      }
      return types[type] || type || 'Стандартный'
    },
    
    getPalletStatusName(status) {
      const statuses = {
        'in_stock': 'На складе',
        'in_repair': 'В ремонте',
        'transferred': 'Передана клиенту',
        'in_transit': 'В пути',
        'written_off': 'Списана'
      }
      return statuses[status] || status
    },
    
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('ru-RU')
    }
  }
}
</script>

<style scoped>
/* Все стили остаются без изменений */
.pallet-manager {
  padding: 10px;
}

.pallets-stats {
  margin-bottom: 20px;
}

.stat-badge {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  padding: 10px;
  background: #e9ecef;
  border-radius: 8px;
  font-size: 14px;
}

.pallets-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
  margin-top: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.pallet-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  background: #f9f9f9;
}

.pallet-info {
  margin-bottom: 10px;
  font-size: 13px;
}

.pallet-info div {
  margin: 5px 0;
}

.pallet-code {
  font-size: 14px;
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.pallet-actions {
  margin-top: 10px;
}

.pallet-actions label {
  font-size: 12px;
  display: block;
  margin-bottom: 5px;
  color: #666;
}

.pallet-actions select {
  width: 100%;
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 13px;
}

.pallet-timestamps {
  font-size: 10px;
  color: #999;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.status-in_stock { color: #28a745; font-weight: bold; }
.status-in_repair { color: #fd7e14; font-weight: bold; }
.status-transferred { color: #007bff; font-weight: bold; }
.status-in_transit { color: #6f42c1; font-weight: bold; }
.status-written_off { color: #dc3545; font-weight: bold; }

.no-pallets {
  text-align: center;
  padding: 40px;
  color: #666;
}

/* Уведомления */
.pallet-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1100;
  animation: slideInRight 0.3s ease;
}

.pallet-notification .notification-content {
  background: #28a745;
  color: white;
  padding: 12px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.pallet-notification .notification-icon {
  font-size: 1.2rem;
}

.pallet-notification .notification-message {
  font-size: 0.9rem;
}

.pallet-notification.fade-out {
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
  .pallet-notification {
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
}
</style>