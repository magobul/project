<template>
  <div class="register container">
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
</template>

<script>
import axios from 'axios'

// Получаем URL API из переменной окружения
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
      loading: false,
      error: ''
    }
  },
  methods: {
    async register() {
      // Валидация
      if (!this.form.name.trim()) {
        alert('Введите имя')
        return
      }
      
      if (!this.form.email.trim()) {
        alert('Введите email')
        return
      }
      
      // Простая валидация email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(this.form.email)) {
        alert('Введите корректный email')
        return
      }
      
      if (!this.form.phone.trim()) {
        alert('Введите телефон')
        return
      }
      
      if (!this.form.password.trim()) {
        alert('Введите пароль')
        return
      }
      
      if (this.form.password.length < 6) {
        alert('Пароль должен быть не менее 6 символов')
        return
      }
      
      this.loading = true
      this.error = ''
      
      try {
        console.log('📝 Отправка регистрации:', this.form.email)
        console.log('📡 API URL:', API_URL)
        
        const response = await axios({
          method: 'post',
          url: `${API_URL}/api/register`,
          data: {
            name: this.form.name.trim(),
            email: this.form.email.trim(),
            phone: this.form.phone.trim(),
            password: this.form.password
          },
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        
        console.log('✅ Ответ сервера:', response.data)
        
        if (response.data.user) {
          // Сохраняем пользователя
          localStorage.setItem('user', JSON.stringify(response.data.user))
          
          // Отправляем событие о входе
          const loginEvent = new CustomEvent('user-login', { 
            detail: { 
              user: response.data.user, 
              timestamp: Date.now(),
              source: 'register'
            } 
          })
          window.dispatchEvent(loginEvent)
          
          alert('✅ Регистрация успешна!')
          this.$router.push('/profile')
        } else {
          alert('❌ Ошибка: неверный формат ответа от сервера')
        }
        
      } catch (error) {
        console.error('❌ Ошибка регистрации:', error)
        
        let errorMessage = 'Ошибка регистрации'
        
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Превышено время ожидания ответа от сервера. Попробуйте позже.'
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }
        
        alert('❌ ' + errorMessage)
        this.error = errorMessage
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.register {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F2E9DE;
  padding: 40px 20px;
}

.form-container {
  width: 100%;
  max-width: 400px;
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
  padding: 12px;
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
    font-size: 1.3rem;
  }
  
  .form-group input {
    padding: 10px;
  }
  
  .btn {
    padding: 10px;
  }
}
</style>