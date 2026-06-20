<template>
  <div class="assign-employee">
    <h3>Назначение сотрудника на заявку #{{ requestId }}</h3>
    
    <div class="form-group">
      <label>Дата и время начала работ</label>
      <input type="datetime-local" v-model="startDatetime" :min="minStartDate" @change="validateDates">
    </div>
    
    <div class="form-group">
      <label>Дата и время окончания работ</label>
      <input type="datetime-local" v-model="endDatetime" :min="startDatetime" @change="validateDates">
    </div>
    
    <!-- Предупреждения -->
    <div v-if="dateError" class="error-message">
      ❌ {{ dateError }}
    </div>
    
    <div v-if="weekendWarning" class="warning-message">
      ⚠️ {{ weekendWarning }}
    </div>
    
    <div v-if="hoursPerDayWarning" class="warning-message">
      ⚠️ {{ hoursPerDayWarning }}
    </div>
    
    <div class="duration-info" v-if="startDatetime && endDatetime && !dateError">
      <p> Период: {{ formatDateRange() }}</p>
      <p>⏱ Продолжительность: {{ durationHours }} часов</p>
      <p> Рабочих дней: {{ workingDays }}</p>
      <p> Часов в день: {{ hoursPerDay.toFixed(1) }} ч/день</p>
    </div>
    
    <button @click="findAvailableEmployees" class="btn-primary" :disabled="!isFormValid || loading || hasWeekend">
      {{ loading ? 'Поиск...' : 'Найти доступных сотрудников' }}
    </button>
    
    <div v-if="loading" class="loading">Поиск сотрудников...</div>
    
    <div v-if="availableEmployees.length > 0" class="employees-list">
      <h4>Доступные сотрудники ({{ availableEmployees.length }}):</h4>
      <div v-for="emp in availableEmployees" :key="emp.id" class="employee-card" :class="{ recommended: emp.recommended }">
        <div class="employee-info">
          <strong>{{ emp.name }}</strong>
          <span class="badge" :class="{ 'badge-recommended': emp.recommended }">
            {{ emp.recommended ? 'Рекомендуемый' : 'Доступен' }}
          </span>
          <p>Должность: {{ emp.position }}</p>
          <p>Стаж: {{ emp.experience_years }} лет</p>
          <p>Специализация: {{ emp.specialization || 'любая' }}</p>
        </div>
        
        <!-- Общая загрузка сотрудника -->
        <div class="employee-total-load">
          <p><strong> Общая загрузка:</strong></p>
          <div class="total-progress-bar">
            <div class="total-progress" :style="{ width: getTotalLoadPercent(emp) + '%' }"></div>
          </div>
          <span class="total-load-text">{{ getTotalLoadHours(emp) }} из 40 часов в неделю</span>
        </div>
        
        <div class="employee-load" v-if="emp.load_by_day && Object.keys(emp.load_by_day).length > 0">
          <p><strong> Загрузка по дням:</strong></p>
          <div v-for="(hours, date) in emp.load_by_day" :key="date" class="daily-load">
            <div class="daily-load-header">
              <span>{{ formatDate(date) }}</span>
              <span>{{ hours }} / 8 ч</span>
            </div>
            <div class="progress-bar">
              <div class="progress" :style="{ width: (hours / 8 * 100) + '%', background: getProgressColor(hours) }"></div>
            </div>
          </div>
        </div>
        <div class="employee-load" v-else>
          <p> Нет запланированных задач на этот период</p>
        </div>
        
        <button @click="assignEmployee(emp)" class="btn-assign" :disabled="assigning === emp.id">
          {{ assigning === emp.id ? 'Назначение...' : 'Назначить' }}
        </button>
      </div>
    </div>
    
    <div v-if="noEmployees && !loading" class="no-employees">
      <p>Нет доступных сотрудников на выбранный период</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default {
  name: 'AssignEmployee',
  props: {
    requestId: {
      type: [Number, String],
      required: true
    },
    serviceDurationDays: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      startDatetime: '',
      endDatetime: '',
      availableEmployees: [],
      loading: false,
      noEmployees: false,
      assigning: null,
      dateError: '',
      hoursPerDayWarning: '',
      weekendWarning: ''
    }
  },
  computed: {
    minStartDate() {
      const now = new Date();
      now.setDate(now.getDate() + 1);
      now.setHours(9, 0, 0, 0);
      return now.toISOString().slice(0, 16);
    },
    durationHours() {
      if (!this.startDatetime || !this.endDatetime) return 0;
      const start = new Date(this.startDatetime);
      const end = new Date(this.endDatetime);
      return ((end - start) / (1000 * 60 * 60)).toFixed(1);
    },
    workingDays() {
      if (!this.startDatetime || !this.endDatetime) return 0;
      const start = new Date(this.startDatetime);
      const end = new Date(this.endDatetime);
      let count = 0;
      const current = new Date(start);
      while (current <= end) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) count++;
        current.setDate(current.getDate() + 1);
      }
      return count || 1;
    },
    hoursPerDay() {
      if (this.durationHours === 0 || this.workingDays === 0) return 0;
      return parseFloat(this.durationHours) / this.workingDays;
    },
    hasWeekend() {
      if (!this.startDatetime || !this.endDatetime) return false;
      const start = new Date(this.startDatetime);
      const end = new Date(this.endDatetime);
      const current = new Date(start);
      while (current <= end) {
        const day = current.getDay();
        if (day === 0 || day === 6) {
          return true;
        }
        current.setDate(current.getDate() + 1);
      }
      return false;
    },
    isFormValid() {
      return this.startDatetime && 
             this.endDatetime && 
             !this.dateError && 
             !this.hoursPerDayWarning &&
             !this.weekendWarning &&
             this.hoursPerDay <= 8;
    }
  },
  watch: {
    startDatetime() {
      this.validateDates();
    },
    endDatetime() {
      this.validateDates();
    }
  },
  mounted() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    this.startDatetime = tomorrow.toISOString().slice(0, 16)
    
    const end = new Date(tomorrow)
    end.setHours(18, 0, 0, 0)
    this.endDatetime = end.toISOString().slice(0, 16)
    
    this.validateDates()
  },
  methods: {
    validateDates() {
      this.dateError = '';
      this.hoursPerDayWarning = '';
      this.weekendWarning = '';
      
      if (!this.startDatetime || !this.endDatetime) {
        return;
      }
      
      const start = new Date(this.startDatetime);
      const end = new Date(this.endDatetime);
      
      // Проверка что время окончания больше времени начала
      if (end <= start) {
        this.dateError = 'Время окончания должно быть позже времени начала';
        return;
      }
      
      // Проверка рабочего времени
      const startHour = start.getHours();
      const startMinute = start.getMinutes();
      const endHour = end.getHours();
      const endMinute = end.getMinutes();
      
      if (startHour < 9 || (startHour === 9 && startMinute < 0)) {
        this.dateError = 'Рабочий день начинается с 9:00';
        return;
      }
      
      if (endHour > 18 || (endHour === 18 && endMinute > 0)) {
        this.dateError = 'Рабочий день заканчивается в 18:00';
        return;
      }
      
      // Проверка максимальной продолжительности
      if (this.durationHours > 160) {
        this.dateError = 'Максимальная продолжительность - 160 часов (20 рабочих дней)';
        return;
      }
      
      // Проверка часов в день
      if (this.hoursPerDay > 8) {
        this.hoursPerDayWarning = `Внимание: ${this.hoursPerDay.toFixed(1)} часов в день превышает норму (8 часов). Рекомендуется увеличить количество дней.`;
      }
      
      if (this.hoursPerDay > 12) {
        this.dateError = `Невозможно: ${this.hoursPerDay.toFixed(1)} часов в день. Максимум - 12 часов при срочных работах.`;
      }
      
      // Проверка на выходные дни
      this.checkWeekends();
    },
    
    checkWeekends() {
      if (!this.startDatetime || !this.endDatetime) {
        this.weekendWarning = '';
        return;
      }
      
      const start = new Date(this.startDatetime);
      const end = new Date(this.endDatetime);
      const current = new Date(start);
      const weekendDays = [];
      
      while (current <= end) {
        const day = current.getDay();
        if (day === 0 || day === 6) {
          const dayName = day === 0 ? 'Воскресенье' : 'Суббота';
          weekendDays.push(`${dayName} (${current.toLocaleDateString('ru-RU')})`);
        }
        current.setDate(current.getDate() + 1);
      }
      
      if (weekendDays.length > 0) {
        const dayText = weekendDays.length === 1 ? 'день' : 'дня';
        this.weekendWarning = `В выбранный период входят выходные ${dayText}: ${weekendDays.join(', ')}. Работы в выходные дни не планируются. Пожалуйста, выберите рабочие дни.`;
      } else {
        this.weekendWarning = '';
      }
    },
    
    getTotalLoadPercent(employee) {
      const totalLoad = this.getTotalLoadHours(employee);
      return Math.min((totalLoad / 40) * 100, 100);
    },
    
    getTotalLoadHours(employee) {
      if (!employee.load_by_day) return 0;
      let total = 0;
      for (let hours of Object.values(employee.load_by_day)) {
        total += hours;
      }
      return total;
    },
    
    getProgressColor(hours) {
      if (hours >= 8) return '#dc3545';
      if (hours >= 6) return '#fd7e14';
      if (hours >= 4) return '#ffc107';
      if (hours > 0) return '#28a745';
      return '#e9ecef';
    },
    
    formatDateRange() {
      if (!this.startDatetime || !this.endDatetime) return '';
      const start = new Date(this.startDatetime);
      const end = new Date(this.endDatetime);
      return `${start.toLocaleDateString('ru-RU')} ${start.toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'})} - ${end.toLocaleDateString('ru-RU')} ${end.toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'})}`;
    },
    
    async findAvailableEmployees() {
      if (!this.isFormValid) {
        if (this.dateError) {
          alert(this.dateError);
        } else if (this.weekendWarning) {
          alert(this.weekendWarning);
        } else if (this.hoursPerDayWarning) {
          alert(this.hoursPerDayWarning);
        }
        return;
      }
      
      this.loading = true;
      this.noEmployees = false;
      
      try {
        const response = await axios.post(`${API_URL}/api/employees/available`, {
          start_datetime: this.startDatetime,
          end_datetime: this.endDatetime,
          service_duration_days: this.workingDays
        });
        
        this.availableEmployees = response.data;
        this.noEmployees = this.availableEmployees.length === 0;
        
        if (this.availableEmployees.length === 0) {
          alert('Нет доступных сотрудников на выбранный период');
        }
      } catch (error) {
        console.error('Ошибка поиска сотрудников:', error);
        alert('Ошибка при поиске сотрудников: ' + (error.response?.data?.error || error.message));
      } finally {
        this.loading = false;
      }
    },
    
    async assignEmployee(employee) {
      const totalLoad = this.getTotalLoadHours(employee);
      const confirmMessage = `Назначить ${employee.name} на эту заявку?\n\n` +
        ` Период: ${this.formatDateRange()}\n` +
        ` Продолжительность: ${this.durationHours} часов\n` +
        ` Рабочих дней: ${this.workingDays}\n` +
        ` Часов в день: ${this.hoursPerDay.toFixed(1)}\n` +
        ` Общая загрузка сотрудника: ${totalLoad} / 40 часов в неделю`;
      
      if (!confirm(confirmMessage)) return;
      
      this.assigning = employee.id;
      
      try {
        const response = await axios.post(`${API_URL}/api/requests/${this.requestId}/assign`, {
          employee_id: employee.id,
          start_datetime: this.startDatetime,
          end_datetime: this.endDatetime
        });
        
        alert('Сотрудник успешно назначен на заявку!');
        this.$emit('assigned', response.data);
        
        setTimeout(() => {
          this.$emit('close');
        }, 1000);
        
      } catch (error) {
        console.error('Ошибка при назначении сотрудника:', error);
        if (error.response?.status === 409) {
          alert('Сотрудник занят в выбранный период. Пожалуйста, выберите другое время.');
        } else {
          alert('Ошибка при назначении сотрудника: ' + (error.response?.data?.error || error.message));
        }
      } finally {
        this.assigning = null;
      }
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
    }
  }
}
</script>

<style scoped>
.assign-employee {
  padding: 20px;
}

.assign-employee h3 {
  color: #5E4239;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #C5907F;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #5E4239;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #C5907F;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s;
  background: #F2E9DE;
  color: #5E4239;
}

.form-group input:focus {
  outline: none;
  border-color: #5E4239;
  background: #FFFFFF;
}

.duration-info {
  background: #E2D4C2;
  padding: 12px 15px;
  border-radius: 12px;
  margin: 15px 0;
  color: #5E4239;
}

.duration-info p {
  margin: 5px 0;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 8px;
  margin: 15px 0;
  font-size: 0.85rem;
  border-left: 3px solid #dc3545;
}

.warning-message {
  background: #fff3cd;
  color: #856404;
  padding: 10px;
  border-radius: 8px;
  margin: 15px 0;
  font-size: 0.85rem;
  border-left: 3px solid #ffc107;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #5E4239;
  color: #F2E9DE;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: #6D4E44;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(94, 66, 57, 0.3);
}

.btn-primary:disabled {
  background: #A97B6C;
  cursor: not-allowed;
  opacity: 0.6;
}

.employees-list {
  margin-top: 25px;
  max-height: 500px;
  overflow-y: auto;
}

.employees-list h4 {
  color: #5E4239;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.employee-card {
  border: 2px solid #C5907F;
  border-radius: 16px;
  padding: 15px;
  margin-bottom: 15px;
  background: #FFFFFF;
  transition: all 0.3s;
}

.employee-card:hover {
  border-color: #5E4239;
  box-shadow: 0 5px 15px rgba(94, 66, 57, 0.15);
}

.employee-card.recommended {
  border: 2px solid #A97B6C;
  background: #F2E9DE;
}

.employee-info {
  margin-bottom: 12px;
}

.employee-info strong {
  color: #5E4239;
  font-size: 1rem;
}

.employee-info p {
  color: #6D4E44;
  margin: 5px 0;
  font-size: 0.85rem;
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  margin-left: 10px;
  background: #A97B6C;
  color: white;
  font-weight: 600;
}

.badge-recommended {
  background: #5E4239;
}

.employee-total-load {
  margin: 10px 0;
  padding: 10px;
  background: #e3f2fd;
  border-radius: 12px;
}

.employee-total-load p {
  color: #1976d2;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.85rem;
}

.total-progress-bar {
  width: 100%;
  height: 10px;
  background: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  margin: 5px 0;
}

.total-progress {
  height: 100%;
  background: #1976d2;
  transition: width 0.3s;
  border-radius: 5px;
}

.total-load-text {
  font-size: 11px;
  color: #666;
  display: block;
  text-align: right;
  margin-top: 5px;
}

.employee-load {
  margin: 10px 0;
  padding: 10px;
  background: #F2E9DE;
  border-radius: 12px;
}

.employee-load p {
  color: #5E4239;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.85rem;
}

.daily-load {
  margin: 8px 0;
}

.daily-load-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #5E4239;
  margin-bottom: 3px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #E2D4C2;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  transition: width 0.3s;
  border-radius: 4px;
}

.btn-assign {
  margin-top: 12px;
  padding: 8px 20px;
  background: #5E4239;
  color: #F2E9DE;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.btn-assign:hover:not(:disabled) {
  background: #6D4E44;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(94, 66, 57, 0.3);
}

.btn-assign:disabled {
  background: #A97B6C;
  cursor: not-allowed;
}

.no-employees {
  text-align: center;
  padding: 25px;
  background: #F2E9DE;
  border-radius: 16px;
  margin-top: 20px;
  color: #5E4239;
}

.no-employees p {
  margin-bottom: 15px;
}

.loading {
  text-align: center;
  padding: 30px;
  font-size: 16px;
  color: #91695D;
}

/* Адаптивность */
@media (max-width: 768px) {
  .assign-employee {
    padding: 15px;
  }
  
  .employee-info p {
    font-size: 0.75rem;
  }
  
  .badge {
    font-size: 9px;
    padding: 2px 6px;
  }
  
  .daily-load-header {
    font-size: 10px;
  }
  
  .employees-list {
    max-height: 400px;
  }
}
</style>