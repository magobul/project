<template>
  <div class="login">
    <div class="container">
      <div class="form-container">
        <h2>Вход в личный кабинет</h2>
        
        <form @submit.prevent="login">
          <div class="form-group">
            <input 
              v-model="form.email" 
              type="email" 
              placeholder="Email" 
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
          <p>Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link></p>
          <p><router-link to="/admin">Вход для администратора</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import socketService from '../plugins/socket.js'

export default {
  name: 'Login',
  data() {
    return {
      form: {
        email: '',
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
      if (!this.form.email.trim()) {
        alert('Введите email')
        return
      }
      
      if (!this.form.password.trim()) {
        alert('Введите пароль')
        return
      }
      
      this.loading = true
      
      try {
        console.log('Попытка входа:', this.form.email)
        
        const response = await axios.post('http://localhost:3000/api/login', {
          email: this.form.email,
          password: this.form.password
        })
        
        console.log('Ответ сервера:', response.data)
        
        if (response.data.user) {
          const userData = response.data.user
          
          // Сохраняем данные пользователя
          localStorage.setItem('user', JSON.stringify(userData))
          
          // Подключаем Socket.IO с данными пользователя
          socketService.connect({
            userId: userData.id,
            userRole: userData.role || 'client',
            clientId: userData.id
          })
          
          // Отправляем событие о входе для обновления других компонентов
          const loginEvent = new CustomEvent('user-login', { 
            detail: { 
              user: userData, 
              timestamp: Date.now(),
              source: 'client-login'
            } 
          })
          window.dispatchEvent(loginEvent)
          
          // Отправляем событие аутентификации через сокет
          if (socketService.isConnected) {
            socketService.emit('client_login', {
              userId: userData.id,
              userEmail: userData.email,
              timestamp: Date.now()
            })
          }
          
          console.log('Вход выполнен успешно')
          
          // Перенаправляем в личный кабинет
          setTimeout(() => {
            this.$router.push('/profile')
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
.login {
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