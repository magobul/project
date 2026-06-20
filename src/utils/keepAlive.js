// src/utils/keepAlive.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Пинг сервера каждые 5 минут, чтобы он не засыпал
export function startKeepAlive() {
    console.log(' Запуск keep-alive для сервера...')
    
    const pingServer = async () => {
        try {
            const response = await fetch(`${API_URL}`)
            if (response.ok) {
                console.log(' Сервер жив:', new Date().toLocaleTimeString())
            }
        } catch (error) {
            console.warn(' Сервер не отвечает:', error.message)
        }
    }
    
    // Первый пинг сразу
    pingServer()
    
    // Затем каждые 4 минуты (240 секунд)
    setInterval(pingServer, 240000)
}