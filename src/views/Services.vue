<template>
  <div class="services">
    <div class="container">
      <h2>Наши услуги</h2>
      <div class="services-list">
        <div v-for="service in services" :key="service.id" class="service-item">
          <h3>{{ service.name }}</h3>
          <p>{{ service.description }}</p>
          <p v-if="service.price_info"><strong>{{ service.price_info }}</strong></p>
          <button v-if="isAuthenticated" @click="goToRequest(service)" class="btn">
            Заказать
          </button>
          <router-link v-else to="/login" class="btn">
            Войдите для заказа
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Services',
  data() {
    return {
      services: [],
      isAuthenticated: false
    }
  },
  mounted() {
    this.loadServices()
    this.checkAuth()
  },
  methods: {
    async loadServices() {
      try {
        const response = await axios.get('http://localhost:3000/api/services')
        this.services = response.data
      } catch (error) {
        console.error('Ошибка загрузки услуг:', error)
      }
    },
    checkAuth() {
      this.isAuthenticated = !!localStorage.getItem('user')
    },
    goToRequest(service) {
      this.$router.push({
        path: '/request',
        query: { service_id: service.id }
      })
    }
  }
}
</script>

<style scoped>
.services {
  background-color: #E2D4C2;
  min-height: 100vh;
  padding: 50px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.services h2 {
  text-align: center;
  margin-bottom: 40px;
  font-size: 2rem;
}

.services-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.service-item {
  background: #ffffff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.service-item h3 {
  color: black;
  margin-bottom: 15px;
}

.service-item p {
  margin-bottom: 15px;
  line-height: 1.6;
}

.btn {
  display: inline-block;
  background: #7D574B;
  color: white;
  padding: 10px 20px;
  text-decoration: none;
  border-radius: 5px;
  border: none;
  cursor: pointer;
}
</style>