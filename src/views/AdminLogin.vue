<template>
  <div class="admin-login">
    <div class="container">
      <div class="form-container">
        <h2>Вход для администратора</h2>
        
        <form @submit.prevent="login">
          <div class="form-group">
            <input 
              v-model="form.username" 
              type="text" 
              placeholder="Логин" 
              required
              :disabled="loading"
            >
          </div>
          
          <div class="form-group">
            <input 
              v-model="form.password" 
              type="password" 
              placeholder="Пароль" 
              required
              :disabled="loading"
            >
          </div>
          
          <button type="submit" class="btn" :disabled="loading">
            {{ loading ? 'Вход...' : 'Войти' }}
          </button>
        </form>
        
        <div class="form-links">
          <p><router-link to="/">Вернуться на сайт</router-link></p>
          <p><router-link to="/login">Вход для клиентов</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import socketService from '../plugins/socket.js'

// Получаем URL API из переменной окружения
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default {
  name: 'AdminLogin',
  data() {
    return {
      form: {
        username: '',
        password: ''
      },
      loading: false
    }
  },
  mounted() {
    // Очищаем старые данные при загрузке страницы
    this.clearAuthData()
  },
  methods: {
    clearAuthData() {
      localStorage.removeItem('user')
      localStorage.removeItem('manager')
      localStorage.removeItem('token')
      
      // Отключаем Socket.IO
      socketService.disconnect()
    },
    
    async login() {
      if (!this.form.username.trim()) {
        alert('Введите логин')
        return
      }
      
      if (!this.form.password.trim()) {
        alert('Введите пароль')
        return
      }
      
      this.loading = true
      
      try {
        console.log('Попытка входа админа:', this.form.username)
        
        const response = await axios.post(`${API_URL}/api/admin/login`, {
          username: this.form.username,
          password: this.form.password
        })
        
        console.log('Ответ сервера:', response.data)
        
        if (response.data.user) {
          const userData = response.data.user
          
          // Сохраняем данные пользователя
          localStorage.setItem('user', JSON.stringify(userData))
          localStorage.setItem('manager', JSON.stringify(userData))
          
          // Подключаем Socket.IO с данными админа
          socketService.connect({
            userId: userData.id,
            userRole: userData.role || 'admin',
            clientId: userData.id
          })
          
          // Отправляем событие о входе для обновления других компонентов
          const loginEvent = new CustomEvent('user-login', { 
            detail: { 
              user: userData, 
              timestamp: Date.now(),
              source: 'admin-login'
            } 
          })
          window.dispatchEvent(loginEvent)
          
          // Отправляем событие аутентификации через сокет
          if (socketService.isConnected) {
            socketService.emit('admin_login', {
              userId: userData.id,
              username: userData.name || userData.email,
              timestamp: Date.now()
            })
          }
          
          console.log('Вход выполнен успешно')
          
          // Перенаправляем в админ-панель
          setTimeout(() => {
            this.$router.push('/admin-panel')
          }, 100)
        } else {
          throw new Error('Неверный формат ответа от сервера')
        }
      } catch (error) {
        console.error('Ошибка входа:', error)
        
        let errorMessage = 'Ошибка входа'
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.message) {
          errorMessage = error.message
        }
        
        alert(errorMessage)
        
        // Очищаем данные при ошибке
        this.clearAuthData()
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.admin-login {
  background-color: #E2D4C2;
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.form-container {
  width: 100%;
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.form-container h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #5E4239;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #7D574B;
  box-shadow: 0 0 5px rgba(125, 87, 75, 0.3);
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.btn {
  width: 100%;
  background: #7D574B;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn:hover:not(:disabled) {
  background: #5c3e35;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-links {
  margin-top: 1.5rem;
  text-align: center;
}

.form-links p {
  margin-bottom: 0.5rem;
  color: #666;
}

.form-links a {
  color: #7D574B;
  text-decoration: none;
  font-weight: 500;
}

.form-links a:hover {
  text-decoration: underline;
}

/* Адаптивность */
@media (max-width: 480px) {
  .form-container {
    padding: 1.5rem;
  }
  
  .form-container h2 {
    font-size: 1.3rem;
    margin-bottom: 1.5rem;
  }
  
  .form-group input {
    padding: 10px;
  }
  
  .btn {
    padding: 10px;
  }
}
</style>