import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { startKeepAlive } from './utils/keepAlive'

// Запускаем пинг сервера
startKeepAlive()
createApp(App).use(router).mount('#app')
