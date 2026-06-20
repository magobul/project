<template>
  <div class="admin-panel">
    <div class="container">
      <div class="admin-card">
        <div class="header">
          <h2>Панель администратора</h2>
          <div class="header-actions">
            <button @click="exportRequests" class="btn-export" :disabled="exporting">
              {{ exporting ? '⏳ Экспорт...' : '📊 Экспорт заявок в Excel' }}
            </button>
            <button @click="exportPallets" class="btn-export" :disabled="exporting">
              {{ exporting ? '⏳ Экспорт...' : '📦 Экспорт паллет в Excel' }}
            </button>
          </div>
        </div>
        
        <!-- Статистика -->
        <div class="stats">
          <div class="stat-card">
            <h3>Всего заявок</h3>
            <p>{{ stats.total_requests || 0 }}</p>
          </div>
          <div class="stat-card">
            <h3>Новых</h3>
            <p>{{ stats.new_requests || 0 }}</p>
          </div>
          <div class="stat-card">
            <h3>В работе</h3>
            <p>{{ stats.in_work_requests || 0 }}</p>
          </div>
          <div class="stat-card">
            <h3>Выполнено</h3>
            <p>{{ stats.completed_requests || 0 }}</p>
          </div>
        </div>
        
        <!-- Блок с круговой диаграммой распределения по услугам -->
        <div class="chart-container">
          <h3>Распределение заявок по видам услуг</h3>
          <div class="pie-chart">
            <div class="chart-wrapper">
              <canvas ref="servicesChart"></canvas>
            </div>
            <div class="chart-legend">
              <div v-for="(value, service) in servicesData" :key="service" class="legend-item">
                <span class="legend-color" :style="{ background: getServiceColor(service) }"></span>
                <span class="legend-text">
                  <strong>{{ service }}</strong>: {{ value }} заявок 
                  <span class="legend-percent">({{ getServicePercentage(service) }}%)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="requests-list">
          <h3>Все заявки</h3>
          
          <div v-if="requests.length === 0" class="no-requests">
            <p>Нет заявок</p>
          </div>
          
          <div v-else class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Клиент</th>
                  <th>Телефон</th>
                  <th>Услуга</th>
                  <th>Статус</th>
                  <th>Сотрудник</th>
                  <th>Дата</th>
                  <th>Паллеты</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="request in requests" :key="request.id" :class="{ 'highlight-new': request.isNew }">
                  <td data-label="ID">{{ request.request_number || request.id }}</td>
                  <td data-label="Клиент">{{ request.client_name }}</td>
                  <td data-label="Телефон">{{ request.phone }}</td>
                  <td data-label="Услуга">{{ request.service_name }}</td>
                  <td data-label="Статус">
                    <select v-model="request.status" @change="updateStatus(request)" class="status-select">
                      <option value="new">Новая</option>
                      <option value="in_work">В работе</option>
                      <option value="completed">Выполнена</option>
                      <option value="cancelled">Отменена</option>
                    </select>
                  </td>
                  <td data-label="Сотрудник">
                    <span v-if="request.assigned_employee_id" class="employee-name">
                      {{ getEmployeeName(request.assigned_employee_id) }}
                    </span>
                    <button v-else @click="openAssignModal(request)" class="btn-assign">
                      Назначить
                    </button>
                  </td>
                  <td data-label="Дата">{{ formatDate(request.created_at) }}</td>
                  <td data-label="Паллеты">
                    <button @click="viewPallets(request)" class="btn-pallets">
                      📦 {{ getPalletsCount(request.id) }}
                    </button>
                  </td>
                  <td data-label="Действия">
                    <button @click="viewDetails(request)" class="btn-small">Подробнее</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Модальное окно с паллетами -->
      <div v-if="showPalletModal" class="modal" @click.self="closePalletModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Паллеты в заявке #{{ selectedRequestId }}</h3>
            <span class="close" @click="closePalletModal">&times;</span>
          </div>
          <PalletsManage :request-id="selectedRequestId" @pallets-loaded="onPalletsLoaded" />
        </div>
      </div>
      
      <!-- Модальное окно назначения сотрудника -->
      <div v-if="showAssignModal" class="modal" @click.self="closeAssignModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Назначение сотрудника</h3>
            <span class="close" @click="closeAssignModal">&times;</span>
          </div>
          <AssignEmployee 
            :request-id="selectedRequest.id" 
            :service-duration-days="selectedRequest.duration_days || 1"
            @assigned="onEmployeeAssigned"
          />
        </div>
      </div>

      <!-- Уведомления -->
      <div v-if="notification.show" class="notification" :class="notification.type">
        <div class="notification-content">
          <span class="notification-icon">🔔</span>
          <div class="notification-text">
            <strong>{{ notification.title }}</strong>
            <p>{{ notification.message }}</p>
          </div>
          <button @click="notification.show = false" class="notification-close">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import socketService from '../plugins/socket.js'
import AssignEmployee from './AssignEmployee.vue'
import PalletsManage from './PalletsManage.vue'
import Chart from 'chart.js/auto'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default {
  name: 'AdminPanel',
  components: {
    AssignEmployee,
    PalletsManage
  },
  data() {
    return {
      requests: [],
      stats: {},
      palletsCount: {},
      showPalletModal: false,
      selectedRequestId: null,
      employees: [],
      showAssignModal: false,
      selectedRequest: null,
      notification: {
        show: false,
        title: '',
        message: '',
        type: 'info'
      },
      exporting: false,
      chartInstance: null,
      servicesData: {
        'Обработка': 0,
        'Ремонт': 0,
        'Переборка': 0,
        'Восстановление': 0,
        'Загрузка/выгрузка': 0
      }
    }
  },
  mounted() {
    const manager = JSON.parse(localStorage.getItem('user'))
    if (!manager || (manager.role !== 'admin' && manager.role !== 'manager')) {
      this.$router.push('/admin')
      return
    }
    
    this.loadData()
    this.loadEmployees()
    this.setupSocket()
  },
  beforeUnmount() {
    socketService.off('new_request')
    socketService.off('request_update')
    socketService.off('pallet_update')
    if (this.chartInstance) {
      this.chartInstance.destroy()
    }
  },
  methods: {
    getServiceColor(service) {
      const colors = {
        'Обработка': '#FF9800',
        'Ремонт': '#2196F3',
        'Переборка': '#4CAF50',
        'Восстановление': '#9C27B0',
        'Загрузка/выгрузка': '#F44336'
      }
      return colors[service] || '#91695D'
    },
    
    getServicePercentage(service) {
      const total = this.stats.total_requests || 0
      const count = this.servicesData[service] || 0
      if (total === 0) return 0
      return ((count / total) * 100).toFixed(1)
    },
    
    setupSocket() {
      const user = JSON.parse(localStorage.getItem('user'))
      socketService.connect({
        userId: user.id,
        userRole: 'admin'
      })
      
      socketService.on('new_request', (data) => {
        this.showNotification(
          'Новая заявка!',
          `Заявка №${data.request_number} от ${data.client_name}`,
          'success'
        )
        this.loadData()
      })
      
      socketService.on('request_update', (data) => {
        this.showNotification(
          'Статус заявки изменен',
          `Заявка №${data.request_number}: ${this.getStatusText(data.status)}`,
          'info'
        )
        this.loadData()
      })
      
      socketService.on('pallet_update', (data) => {
        this.showNotification(
          'Обновление паллеты',
          `Паллета ${data.pallet_code}: статус изменен`,
          'info'
        )
        if (data.request_id) {
          this.loadPalletsCountForRequest(data.request_id)
        }
      })
    },
    
    showNotification(title, message, type) {
      this.notification.title = title
      this.notification.message = message
      this.notification.type = type
      this.notification.show = true
      
      setTimeout(() => {
        this.notification.show = false
      }, 5000)
    },
    
    getStatusText(status) {
      const texts = {
        new: 'Новая',
        in_work: 'В работе',
        completed: 'Выполнена',
        cancelled: 'Отменена'
      }
      return texts[status] || status
    },
    
    async loadData() {
      try {
        const [requestsRes, statsRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/requests`),
          axios.get(`${API_URL}/api/admin/stats`)
        ])
        
        this.requests = requestsRes.data
        this.stats = statsRes.data
        
        // Сбрасываем счетчики услуг
        for (let service in this.servicesData) {
          this.servicesData[service] = 0
        }
        
        // Подсчитываем заявки по услугам
        this.requests.forEach(request => {
          const serviceName = request.service_name
          if (this.servicesData.hasOwnProperty(serviceName)) {
            this.servicesData[serviceName]++
          }
        })
        
        for (const request of this.requests) {
          this.palletsCount[request.id] = 0
        }
        await this.loadPalletsCount()
        this.updateChart()
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      }
    },
    
    updateChart() {
      const canvas = this.$refs.servicesChart
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      
      if (this.chartInstance) {
        this.chartInstance.destroy()
      }
      
      // Фильтруем услуги с нулевым количеством
      const services = Object.keys(this.servicesData).filter(service => this.servicesData[service] > 0)
      const data = services.map(service => this.servicesData[service])
      const colors = services.map(service => this.getServiceColor(service))
      
      if (services.length === 0) {
        return
      }
      
      this.chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: services,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderColor: '#FFFFFF',
            borderWidth: 2,
            hoverOffset: 12
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#5E4239',
              titleColor: '#F2E9DE',
              bodyColor: '#F2E9DE',
              borderColor: '#C5907F',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  const label = context.label || ''
                  const value = context.raw || 0
                  const total = context.dataset.data.reduce((a, b) => a + b, 0)
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                  return `${label}: ${value} заявок (${percentage}%)`
                }
              }
            }
          },
          animation: {
            animateScale: true,
            animateRotate: true
          }
        }
      })
    },
    
    async loadEmployees() {
      try {
        const response = await axios.get(`${API_URL}/api/admin/employees`)
        this.employees = response.data
      } catch (error) {
        console.error('Ошибка загрузки сотрудников:', error)
      }
    },
    
    getEmployeeName(employeeId) {
      const employee = this.employees.find(e => e.id === employeeId)
      return employee ? employee.name : 'Неизвестный'
    },
    
    async loadPalletsCount() {
      for (const request of this.requests) {
        await this.loadPalletsCountForRequest(request.id)
      }
    },
    
    async loadPalletsCountForRequest(requestId) {
      try {
        const response = await axios.get(`${API_URL}/api/requests/${requestId}/pallets`)
        this.palletsCount[requestId] = response.data.length
      } catch (error) {
        this.palletsCount[requestId] = 0
      }
    },
    
    getPalletsCount(requestId) {
      return this.palletsCount[requestId] || 0
    },
    
    onPalletsLoaded(data) {
      if (data && data.requestId && data.count !== undefined) {
        this.palletsCount[data.requestId] = data.count
      }
    },
    
    async updateStatus(request) {
      try {
        await axios.put(`${API_URL}/api/admin/requests/${request.id}`, {
          status: request.status
        })
        this.showNotification('Статус обновлен', `Статус заявки изменен на ${this.getStatusText(request.status)}`, 'success')
        await this.loadData()
      } catch (error) {
        this.showNotification('Ошибка', 'Не удалось обновить статус', 'error')
        this.loadData()
      }
    },
    
    viewDetails(request) {
      const message = `Заявка #${request.id}
Клиент: ${request.client_name}
Телефон: ${request.phone}
Email: ${request.email}
Услуга: ${request.service_name}
Статус: ${this.getStatusText(request.status)}
Описание: ${request.description || 'Нет описания'}
${request.assigned_employee_id ? 'Сотрудник: ' + this.getEmployeeName(request.assigned_employee_id) : 'Сотрудник не назначен'}`
      alert(message)
    },
    
    openAssignModal(request) {
      this.selectedRequest = request
      this.showAssignModal = true
    },
    
    closeAssignModal() {
      this.showAssignModal = false
      this.selectedRequest = null
    },
    
    onEmployeeAssigned(data) {
      this.closeAssignModal()
      this.loadData()
      this.showNotification('Сотрудник назначен', 'Сотрудник успешно назначен на заявку', 'success')
    },
    
    viewPallets(request) {
      this.selectedRequestId = request.id
      this.showPalletModal = true
    },
    
    closePalletModal() {
      this.showPalletModal = false
      if (this.selectedRequestId) {
        this.loadPalletsCountForRequest(this.selectedRequestId)
      }
      this.selectedRequestId = null
    },
    
    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU')
    },
    
    // Экспорт в Excel
    async exportRequests() {
  if (this.exporting) return
  
  this.exporting = true
  try {
    console.log('📊 Начинаем экспорт заявок...')
    
    const response = await axios({
      method: 'get',
      url: `${API_URL}/api/admin/export/excel`,
      responseType: 'blob',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    // Проверяем, что ответ - это файл
    const contentType = response.headers['content-type']
    if (!contentType || !contentType.includes('spreadsheetml.sheet')) {
      // Если пришла ошибка в формате JSON
      const text = await response.data.text()
      try {
        const errorData = JSON.parse(text)
        throw new Error(errorData.error || 'Ошибка экспорта')
      } catch {
        throw new Error('Неверный формат ответа от сервера')
      }
    }
    
    // Создаем ссылку для скачивания
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Извлекаем имя файла из заголовка или используем стандартное
    let fileName = `заявки_${new Date().toISOString().split('T')[0]}.xlsx`
    const contentDisposition = response.headers['content-disposition']
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (match && match[1]) {
        fileName = match[1].replace(/['"]/g, '')
      }
    }
    
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Очищаем URL
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 100)
    
    this.showNotification(' Экспорт выполнен', 'Данные заявок успешно экспортированы в Excel', 'success')
    
  } catch (error) {
    console.error(' Ошибка экспорта:', error)
    this.showNotification(' Ошибка', 'Не удалось экспортировать данные: ' + (error.message || 'Неизвестная ошибка'), 'error')
  } finally {
    this.exporting = false
  }
},

async exportPallets() {
  if (this.exporting) return
  
  this.exporting = true
  try {
    console.log('📊 Начинаем экспорт паллет...')
    
    const response = await axios({
      method: 'get',
      url: `${API_URL}/api/admin/export/pallets-excel`,
      responseType: 'blob',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    // Проверяем, что ответ - это файл
    const contentType = response.headers['content-type']
    if (!contentType || !contentType.includes('spreadsheetml.sheet')) {
      const text = await response.data.text()
      try {
        const errorData = JSON.parse(text)
        throw new Error(errorData.error || 'Ошибка экспорта')
      } catch {
        throw new Error('Неверный формат ответа от сервера')
      }
    }
    
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    let fileName = `паллеты_${new Date().toISOString().split('T')[0]}.xlsx`
    const contentDisposition = response.headers['content-disposition']
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (match && match[1]) {
        fileName = match[1].replace(/['"]/g, '')
      }
    }
    
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 100)
    
    this.showNotification(' Экспорт выполнен', 'Данные паллет успешно экспортированы в Excel', 'success')
    
  } catch (error) {
    console.error(' Ошибка экспорта:', error)
    this.showNotification(' Ошибка', 'Не удалось экспортировать данные: ' + (error.message || 'Неизвестная ошибка'), 'error')
  } finally {
    this.exporting = false
  }
}
  },
  watch: {
    servicesData: {
      handler() {
        this.updateChart()
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.admin-panel {
  background-color: #E2D4C2;
  min-height: 100vh;
  padding: 40px 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.admin-card {
  background: #F2E9DE;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(94, 66, 57, 0.15);
  overflow: hidden;
  padding: 30px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.header h2 {
  color: #5E4239;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-export {
  background: #5E4239;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-export:hover:not(:disabled) {
  background: #6D4E44;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(94, 66, 57, 0.3);
}

.btn-export:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: #FFFFFF;
  padding: 20px;
  border-radius: 16px;
  text-align: center;
  border: 2px solid #C5907F;
  transition: all 0.3s;
}

.stat-card:hover {
  border-color: #5E4239;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(94, 66, 57, 0.15);
}

.stat-card h3 {
  color: #91695D;
  margin-bottom: 10px;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-card p {
  font-size: 2rem;
  font-weight: bold;
  color: #5E4239;
  margin: 0;
}

/* Стили для круговой диаграммы */
.chart-container {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 25px 30px;
  margin-bottom: 40px;
  border: 2px solid #C5907F;
}

.chart-container h3 {
  color: #5E4239;
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: center;
}

.pie-chart {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 40px;
}

.chart-wrapper {
  flex: 0 0 auto;
  width: 280px;
  height: 280px;
  position: relative;
}

.chart-wrapper canvas {
  width: 100% !important;
  height: 100% !important;
}

.chart-legend {
  flex: 1;
  min-width: 220px;
  max-width: 300px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  transition: all 0.3s;
  background: #F2E9DE;
}

.legend-item:hover {
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(94, 66, 57, 0.15);
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.legend-text {
  color: #5E4239;
  font-size: 0.9rem;
  line-height: 1.3;
}

.legend-percent {
  color: #91695D;
  font-size: 0.8rem;
  margin-left: 3px;
}

.requests-list {
  margin-top: 20px;
}

.requests-list h3 {
  color: #5E4239;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #C5907F;
}

.table-responsive {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(94, 66, 57, 0.1);
  font-size: 0.9rem;
}

th, td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #E2D4C2;
}

th {
  background: #E2D4C2;
  color: #5E4239;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

tr:hover {
  background: #F2E9DE;
}

.status-select {
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid #C5907F;
  background: #F2E9DE;
  color: #5E4239;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;
}

.status-select:hover {
  border-color: #5E4239;
}

.btn-assign {
  background: #C5907F;
  color: #F2E9DE;
  border: none;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-assign:hover {
  background: #91695D;
  transform: translateY(-1px);
}

.btn-pallets {
  background: #5E4239;
  color: #F2E9DE;
  border: none;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-pallets:hover {
  background: #6D4E44;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(94, 66, 57, 0.2);
}

.btn-small {
  background: #C5907F;
  color: #F2E9DE;
  border: none;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-small:hover {
  background: #91695D;
  transform: translateY(-1px);
}

.employee-name {
  color: #5E4239;
  font-weight: bold;
  font-size: 0.8rem;
}

.no-requests {
  text-align: center;
  padding: 60px;
  color: #91695D;
  background: #FFFFFF;
  border-radius: 16px;
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
  max-width: 700px;
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
  font-size: 1.2rem;
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

/* Уведомления */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1100;
  animation: slideIn 0.3s ease;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 300px;
}

.notification.success {
  border-left: 4px solid #4caf50;
}

.notification.error {
  border-left: 4px solid #f44336;
}

.notification.info {
  border-left: 4px solid #2196f3;
}

.notification-icon {
  font-size: 1.5rem;
}

.notification-text {
  flex: 1;
}

.notification-text p {
  margin: 5px 0 0;
  font-size: 0.85rem;
  color: #666;
}

.notification-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #999;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .admin-panel {
    padding: 20px;
  }
  
  .admin-card {
    padding: 20px;
  }
  
  .header h2 {
    font-size: 1.3rem;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .btn-export {
    flex: 1;
    font-size: 0.8rem;
    padding: 8px 12px;
  }
  
  .stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .stat-card p {
    font-size: 1.5rem;
  }
  
  .pie-chart {
    flex-direction: column;
    gap: 25px;
  }
  
  .chart-wrapper {
    width: 220px;
    height: 220px;
  }
  
  .chart-legend {
    max-width: 100%;
    min-width: auto;
  }
  
  .legend-text {
    font-size: 0.85rem;
  }
  
  .legend-color {
    width: 18px;
    height: 18px;
  }
  
  table {
    font-size: 0.8rem;
  }
  
  th, td {
    padding: 8px 10px;
    font-size: 0.8rem;
  }
  
  .btn-assign, .btn-pallets, .btn-small {
    padding: 4px 10px;
    font-size: 0.7rem;
  }
  
  .notification {
    left: 20px;
    right: 20px;
  }
  
  .notification-content {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .stats {
    grid-template-columns: 1fr;
  }
  
  .chart-wrapper {
    width: 200px;
    height: 200px;
  }
  
  .chart-container {
    padding: 15px 20px;
  }
  
  .chart-container h3 {
    font-size: 1rem;
  }
  
  .legend-item {
    padding: 8px 10px;
  }
  
  .legend-text {
    font-size: 0.8rem;
  }
  
  .legend-color {
    width: 16px;
    height: 16px;
    margin-right: 10px;
  }
  
  table {
    font-size: 0.75rem;
  }
  
  th, td {
    display: block;
    text-align: right;
    position: relative;
    padding-left: 50%;
  }
  
  th {
    display: none;
  }
  
  td::before {
    content: attr(data-label);
    position: absolute;
    left: 10px;
    width: 45%;
    text-align: left;
    font-weight: bold;
    color: #5E4239;
    font-size: 0.7rem;
  }
  
  .modal-content {
    width: 95%;
  }
}
</style>