<template>
  <div class="register">
    <div class="container">
      <div class="form-container">
        <h2>Регистрация</h2>
        <form @submit.prevent="register">
          <div class="form-group">
            <label>Имя Фамилия</label>
            <input v-model="form.name" type="text" required>
          </div>
          
          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" required>
          </div>
          
          <div class="form-group">
            <label>Телефон</label>
            <input v-model="form.phone" type="tel" required>
          </div>
          
          <div class="form-group">
            <label>Пароль</label>
            <input v-model="form.password" type="password" required>
          </div>
          
          <button type="submit" class="btn" :disabled="loading">
            {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
          </button>
        </form>
        
        <p class="login-link">
          Уже есть аккаунт? <router-link to="/login">Войти</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import socketService from '../plugins/socket.js'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default {
  name: 'Register',
  data() {
    return {
      form: {
        email: '',
        password: '',
        name: '',
        phone: ''
      },
      loading: false
    }
  },
  methods: {
    async register() {
      // Валидация перед отправкой
      if (!this.form.name.trim()) {
        alert('Введите имя');
        return;
      }
      
      if (!this.form.email.trim()) {
        alert('Введите email');
        return;
      }
      
      if (!this.form.phone.trim()) {
        alert('Введите телефон');
        return;
      }
      
      if (!this.form.password.trim()) {
        alert('Введите пароль');
        return;
      }
      
      this.loading = true;
      
      try {
        const response = await axios.post(`${API_URL}/api/register`, this.form)
        
        console.log('Ответ сервера:', response.data);
        
        // Проверяем разные варианты ответа от сервера
        if (response.data.user) {
          // Сохраняем данные пользователя
          localStorage.setItem('user', JSON.stringify(response.data.user))
          
          // Подключаем Socket.IO
          socketService.connect({
            userId: response.data.user.id,
            userRole: response.data.user.role || 'client',
            clientId: response.data.user.id
          })
          
          // Отправляем событие о входе
          window.dispatchEvent(new CustomEvent('user-login', { 
            detail: { user: response.data.user, timestamp: Date.now() } 
          }))
          
          alert('Регистрация успешна!');
          this.$router.push('/profile')
        } else if (response.data.client) {
          // Для обратной совместимости
          localStorage.setItem('user', JSON.stringify(response.data.client))
          
          socketService.connect({
            userId: response.data.client.id,
            userRole: 'client',
            clientId: response.data.client.id
          })
          
          window.dispatchEvent(new CustomEvent('user-login', { 
            detail: { user: response.data.client, timestamp: Date.now() } 
          }))
          
          alert('Регистрация успешна!');
          this.$router.push('/profile')
        } else {
          alert('Ошибка: неверный формат ответа от сервера');
        }
      } catch (error) {
        console.error('Ошибка регистрации:', error);
        const errorMsg = error.response?.data?.error || 'Ошибка регистрации'
        alert(errorMsg)
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.register {
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
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #5E4239;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  transition: all 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #7D574B;
  box-shadow: 0 0 5px rgba(125, 87, 75, 0.3);
}

.btn {
  width: 100%;
  background: #7D574B;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
}

.btn:hover:not(:disabled) {
  background: #5c3e35;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 1rem;
  color: #666;
}

.login-link a {
  color: #7D574B;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .form-container {
    padding: 1.5rem;
  }
  
  .form-container h2 {
    font-size: 1.5rem;
  }
  
  .form-group input {
    padding: 8px;
  }
  
  .btn {
    padding: 10px;
  }
}
</style>