<template>
  <div class="profile">
    <div class="container">
      <div class="profile-card">
        <h2>Личный кабинет</h2>
        
        <div class="profile-content">
          <div class="profile-info">
            <h3>Данные профиля</h3>
            
            <div class="info-item">
              <label>Имя:</label>
              <p>{{ user.name || 'Не указано' }}</p>
            </div>
            
            <div class="info-item">
              <label>Email:</label>
              <p>{{ user.email || 'Не указан' }}</p>
            </div>
            
            <div class="info-item">
              <label>Телефон:</label>
              <p>{{ user.phone || 'Не указан' }}</p>
            </div>
            
            <div class="info-item">
              <label>Дата регистрации:</label>
              <p>{{ formatDate(user.created_at) || 'Не указана' }}</p>
            </div>
          </div>
          
          <div class="profile-actions">
            <h3>Быстрые действия</h3>
            
            <router-link to="/request" class="action-link">
              <div class="action-item">
                <div class="action-text">
                  <h4>Создать новую заявку</h4>
                  <p>Оформить заказ на услуги</p>
                </div>
              </div>
            </router-link>
            
            <router-link to="/my-requests" class="action-link">
              <div class="action-item">
                <div class="action-text">
                  <h4>Мои заявки</h4>
                  <p>Просмотреть историю заказов</p>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Profile',
  data() {
    return {
      user: {
        name: '',
        email: '',
        phone: '',
        created_at: ''
      }
    }
  },
  mounted() {
    this.loadUserData()
  },
  methods: {
    loadUserData() {
      const user = JSON.parse(localStorage.getItem('user'))
      if (!user) {
        this.$router.push('/login')
        return
      }
      this.user = user
      
      // Если нет даты регистрации, пробуем получить её с сервера
      if (!this.user.created_at && this.user.id) {
        this.fetchUserFromServer()
      }
    },
    
    async fetchUserFromServer() {
      try {
        const response = await axios.get(`http://localhost:3000/api/users/${this.user.id}`)
        if (response.data && response.data.created_at) {
          this.user.created_at = response.data.created_at
          // Обновляем данные в localStorage
          const updatedUser = { ...this.user, created_at: response.data.created_at }
          localStorage.setItem('user', JSON.stringify(updatedUser))
        }
      } catch (error) {
        console.error('Ошибка получения данных пользователя:', error)
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return 'Не указана'
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.profile {
  background-color: #E2D4C2;
  min-height: 100vh;
  padding: 40px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
}

.profile-card {
  background: #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(94, 66, 57, 0.15);
  overflow: hidden;
  padding: 30px;
}

.profile-card h2 {
  color: #5E4239;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 30px;
  text-align: center;
}

.profile-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.profile-info h3,
.profile-actions h3 {
  color: #5E4239;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 25px;
  padding-bottom: 10px;
  border-bottom: 2px solid #C5907F;
}

.info-item {
  margin-bottom: 20px;
  padding: 12px 15px;
  background: #F2E9DE;
  border-radius: 12px;
  border: 1px solid #E2D4C2;
  transition: all 0.3s;
}

.info-item:hover {
  border-color: #C5907F;
  box-shadow: 0 2px 8px rgba(94, 66, 57, 0.1);
}

.info-item label {
  display: block;
  font-weight: 700;
  color: #91695D;
  margin-bottom: 5px;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item p {
  color: #5E4239;
  font-size: 1rem;
  margin: 0;
  font-weight: 500;
}

.profile-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-link {
  text-decoration: none;
  color: inherit;
}

.action-item {
  background: #FFFFFF;
  padding: 20px;
  border-radius: 16px;
  border: 2px solid #C5907F;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
}

.action-item:hover {
  border-color: #5E4239;
  background: #E2D4C2;
  transform: translateX(5px);
  box-shadow: 0 5px 15px rgba(94, 66, 57, 0.15);
}

.action-icon {
  font-size: 2.5rem;
}

.action-text {
  flex: 1;
}

.action-text h4 {
  color: #5E4239;
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.action-text p {
  color: #91695D;
  margin: 0;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .profile {
    padding: 20px;
  }
  
  .profile-card {
    padding: 20px;
  }
  
  .profile-card h2 {
    font-size: 1.5rem;
  }
  
  .profile-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .profile-info h3,
  .profile-actions h3 {
    font-size: 1.2rem;
  }
  
  .action-item {
    padding: 15px;
  }
  
  .action-icon {
    font-size: 2rem;
  }
  
  .action-text h4 {
    font-size: 1rem;
  }
}
</style>