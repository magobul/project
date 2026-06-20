<template>
  <header class="header">
    <div class="container">
      <nav class="nav">
        <div class="logo">
          <router-link to="/">ООО "Квадрат"</router-link>
        </div>
        <ul class="nav-menu">
          <li><router-link to="/">Главная</router-link></li>
          <li><router-link to="/services">Услуги</router-link></li>
          <li><router-link to="/gallery">Галерея</router-link></li>
          <li><router-link to="/about">О компании</router-link></li>
          <li><router-link to="/contacts">Контакты</router-link></li>
          
          <template v-if="isAuthenticated">
            <template v-if="userRole === 'client'">
              <li><router-link to="/request">Создать заявку</router-link></li>
              <li><router-link to="/my-requests">Мои заявки</router-link></li>
              <li class="user-name">
                <router-link to="/profile">{{ userName }}</router-link>
              </li>
            </template>
            
            <template v-if="isAdmin">
              <li><router-link to="/admin-panel">Панель админа</router-link></li>
              <li class="admin-name">{{ userName }}</li>
            </template>
            
            <li><button @click="logout" class="logout-btn">Выйти</button></li>
          </template>
          
          <template v-else>
            <li><router-link to="/login">Вход</router-link></li>
            <li><router-link to="/register">Регистрация</router-link></li>
          </template>
        </ul>
        
        <!-- Мобильное меню -->
        <button class="mobile-menu-btn" @click="toggleMobileMenu">
          ☰
        </button>
      </nav>
      
      <!-- Мобильное выпадающее меню -->
      <div v-if="mobileMenuOpen" class="mobile-menu">
        <router-link to="/" @click="closeMobileMenu">Главная</router-link>
        <router-link to="/services" @click="closeMobileMenu">Услуги</router-link>
        <router-link to="/gallery" @click="closeMobileMenu">Галерея</router-link>
        <router-link to="/about" @click="closeMobileMenu">О компании</router-link>
        <router-link to="/contacts" @click="closeMobileMenu">Контакты</router-link>
        
        <template v-if="isAuthenticated">
          <template v-if="userRole === 'client'">
            <router-link to="/request" @click="closeMobileMenu">Создать заявку</router-link>
            <router-link to="/my-requests" @click="closeMobileMenu">Мои заявки</router-link>
            <router-link to="/profile" @click="closeMobileMenu">{{ userName }}</router-link>
          </template>
          
          <template v-if="isAdmin">
            <router-link to="/admin-panel" @click="closeMobileMenu">Панель админа</router-link>
            <span class="mobile-admin-name">{{ userName }}</span>
          </template>
          
          <button @click="logout" class="mobile-logout-btn">Выйти</button>
        </template>
        
        <template v-else>
          <router-link to="/login" @click="closeMobileMenu">Вход</router-link>
          <router-link to="/register" @click="closeMobileMenu">Регистрация</router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script>
import socketService from '../plugins/socket.js'

export default {
  name: 'Header',
  data() {
    return {
      user: null,
      manager: null,
      mobileMenuOpen: false,
      socketEventsInitialized: false
    }
  },
  computed: {
    isAuthenticated() {
      return !!(this.user || this.manager)
    },
    isAdmin() {
      return !!(this.manager || (this.user && (this.user.role === 'admin' || this.user.role === 'manager')))
    },
    userRole() {
      if (this.manager) return 'manager'
      if (this.user) return this.user.role || 'client'
      return null
    },
    userName() {
      if (this.manager) {
        return this.manager.name || this.manager.username || this.manager.email || 'Менеджер'
      }
      if (this.user) {
        return this.user.name || this.user.email || 'Пользователь'
      }
      return ''
    }
  },
  created() {
    this.loadUserData()
    this.initSocketConnection()
    
    // Слушаем кастомные события
    window.addEventListener('user-login', this.handleUserLogin)
    window.addEventListener('user-logout', this.handleUserLogout)
    window.addEventListener('auth-update', this.handleAuthUpdate)
  },
  mounted() {
    this.$nextTick(() => {
      this.loadUserData()
    })
  },
  beforeUnmount() {
    window.removeEventListener('user-login', this.handleUserLogin)
    window.removeEventListener('user-logout', this.handleUserLogout)
    window.removeEventListener('auth-update', this.handleAuthUpdate)
    
    if (this.socketEventsInitialized) {
      socketService.off('auth_update')
    }
  },
  watch: {
    '$route'() {
      this.closeMobileMenu()
    },
    user: {
      handler() {
        this.$forceUpdate()
      },
      deep: true
    },
    manager: {
      handler() {
        this.$forceUpdate()
      },
      deep: true
    }
  },
  methods: {
    loadUserData() {
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const userData = JSON.parse(userStr)
          this.user = userData
          this.manager = null
          console.log('Загружен пользователь:', userData?.name || userData?.email)
          return
        }
        
        const managerStr = localStorage.getItem('manager')
        if (managerStr) {
          const managerData = JSON.parse(managerStr)
          this.manager = managerData
          this.user = null
          console.log('Загружен менеджер:', managerData?.name)
          return
        }
        
        this.user = null
        this.manager = null
      } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error)
        this.user = null
        this.manager = null
      }
    },
    
    initSocketConnection() {
      const currentUser = this.user || this.manager
      const userId = currentUser?.id
      const userRole = this.userRole
      
      if (userId && userRole) {
        socketService.connect({
          userId: userId,
          userRole: userRole,
          clientId: userId
        })
        this.setupSocketEvents()
      } else {
        socketService.connect()
        this.setupSocketEvents()
      }
    },
    
    setupSocketEvents() {
      if (this.socketEventsInitialized) return
      
      socketService.on('auth_update', (data) => {
        console.log('Получено обновление аутентификации:', data)
        if (data.type === 'login') {
          this.loadUserData()
          this.$forceUpdate()
        } else if (data.type === 'logout') {
          this.loadUserData()
          this.$forceUpdate()
        }
      })
      
      this.socketEventsInitialized = true
    },
    
    handleUserLogin(event) {
      console.log('Событие входа пользователя:', event.detail)
      this.loadUserData()
      
      const currentUser = this.user || this.manager
      if (currentUser?.id) {
        socketService.connect({
          userId: currentUser.id,
          userRole: this.userRole,
          clientId: currentUser.id
        })
      }
      
      this.$forceUpdate()
    },
    
    handleUserLogout(event) {
      console.log('Событие выхода пользователя')
      this.loadUserData()
      socketService.disconnect()
      this.socketEventsInitialized = false
      this.$forceUpdate()
    },
    
    handleAuthUpdate(event) {
      console.log('Событие обновления авторизации:', event.detail)
      this.loadUserData()
      this.$forceUpdate()
    },
    
    async logout() {
      try {
        const currentUser = this.user || this.manager
        
        socketService.disconnect()
        this.socketEventsInitialized = false
        
        localStorage.removeItem('user')
        localStorage.removeItem('manager')
        
        this.user = null
        this.manager = null
        
        window.dispatchEvent(new CustomEvent('user-logout', { 
          detail: { timestamp: Date.now() } 
        }))
        
        this.closeMobileMenu()
        this.$router.push('/')
        this.$forceUpdate()
        
        console.log('Выход выполнен успешно')
      } catch (error) {
        console.error('Ошибка при выходе:', error)
      }
    },
    
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
    },
    
    closeMobileMenu() {
      this.mobileMenuOpen = false
    }
  }
}
</script>

<style scoped>
.header {
  background: #5E4239;
  color: white;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
}

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.logo a {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  transition: opacity 0.3s ease;
}

.logo a:hover {
  opacity: 0.9;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 1.5rem;
  align-items: center;
  margin: 0;
  padding: 0;
}

.nav-menu a {
  color: white;
  text-decoration: none;
  padding: 5px 0;
  position: relative;
  font-size: 0.95rem;
  transition: color 0.3s ease;
}

.nav-menu a:hover {
  color: #E2D4C2;
}

.nav-menu a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: #E2D4C2;
  transition: width 0.3s ease;
}

.nav-menu a:hover::after,
.nav-menu .router-link-active::after {
  width: 100%;
}

.nav-menu .router-link-active {
  color: #E2D4C2;
}

.user-name a,
.user-name {
  color: #F2E9DE;
  font-weight: bold;
}

.admin-name {
  color: #F2E9DE;
  font-weight: bold;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 0.95rem;
}

.logout-btn {
  background: #7D574B;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: #b71c1c;
  transform: translateY(-1px);
}

/* Мобильное меню */
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.8rem;
  cursor: pointer;
  padding: 5px;
  transition: opacity 0.3s ease;
}

.mobile-menu-btn:hover {
  opacity: 0.8;
}

.mobile-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #5E4239;
  flex-direction: column;
  padding: 1rem;
  gap: 0.8rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 999;
}

.mobile-menu a {
  color: white;
  text-decoration: none;
  padding: 10px;
  border-radius: 5px;
  transition: all 0.3s ease;
  display: block;
}

.mobile-menu a:hover,
.mobile-menu .router-link-active {
  background: rgba(255, 255, 255, 0.1);
  color: #E2D4C2;
}

.mobile-admin-name {
  color: #F2E9DE;
  font-weight: bold;
  padding: 10px;
  display: block;
}

.mobile-logout-btn {
  background: #7D574B;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.95rem;
  margin-top: 5px;
  transition: all 0.3s ease;
}

.mobile-logout-btn:hover {
  background: #b71c1c;
}

/* Адаптивность */
@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  
  .mobile-menu-btn {
    display: block;
  }
  
  .mobile-menu {
    display: flex;
  }
  
  .logo a {
    font-size: 1.2rem;
  }
}

@media (min-width: 769px) {
  .mobile-menu {
    display: none !important;
  }
}
</style>