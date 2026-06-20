import { io } from 'socket.io-client';

// Получаем URL API из переменной окружения
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.userId = null;
        this.userRole = null;
        this.eventHandlers = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect(userData) {
        if (!this.socket) {
            console.log('🔌 Подключение к Socket.IO:', SOCKET_URL);
            
            this.socket = io(SOCKET_URL, {
                transports: ['websocket', 'polling'], // пробуем websocket, если не работает - polling
                autoConnect: true,
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                // Добавляем таймаут для подключения
                timeout: 10000
            });

            this.socket.on('connect', () => {
                console.log('✅ Socket.IO подключен к:', SOCKET_URL);
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                if (userData && userData.userId) {
                    this.authenticate(userData);
                }
            });

            this.socket.on('disconnect', (reason) => {
                console.log('❌ Socket.IO отключен:', reason);
                this.isConnected = false;
            });

            this.socket.on('connect_error', (error) => {
                console.error('⚠️ Ошибка подключения Socket.IO:', error.message);
                this.isConnected = false;
                this.reconnectAttempts++;
                
                // Если не удается подключиться через websocket, пробуем polling
                if (this.reconnectAttempts > 2) {
                    console.log('🔄 Переключение на polling transport');
                    this.socket.io.opts.transports = ['polling', 'websocket'];
                }
            });
            
            this.socket.on('authenticated', (data) => {
                console.log('🔐 Аутентификация успешна:', data);
                this.userId = data.userId;
                this.userRole = data.userRole;
            });
        }
        return this.socket;
    }

    authenticate(userData) {
        if (this.socket && this.isConnected) {
            console.log('🔐 Отправка аутентификации:', userData);
            this.socket.emit('authenticate', userData);
        } else {
            console.warn('⚠️ Не удалось отправить аутентификацию: сокет не подключен');
        }
    }

    disconnect() {
        if (this.socket) {
            // Удаляем все обработчики
            for (const [event, handlers] of this.eventHandlers) {
                handlers.forEach(handler => {
                    this.socket.off(event, handler);
                });
            }
            this.eventHandlers.clear();
            
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.userId = null;
            this.userRole = null;
            this.reconnectAttempts = 0;
            console.log('🔌 Socket.IO отключен');
        }
    }

    getSocket() {
        return this.socket;
    }

    on(event, callback) {
        if (this.socket) {
            if (!this.eventHandlers.has(event)) {
                this.eventHandlers.set(event, []);
            }
            this.eventHandlers.get(event).push(callback);
            this.socket.on(event, callback);
        } else {
            console.warn(`⚠️ Не удалось добавить обработчик для события ${event}: сокет не инициализирован`);
        }
    }

    off(event, callback) {
        if (this.socket) {
            if (callback) {
                this.socket.off(event, callback);
                const handlers = this.eventHandlers.get(event);
                if (handlers) {
                    const index = handlers.indexOf(callback);
                    if (index > -1) handlers.splice(index, 1);
                }
            } else {
                this.socket.off(event);
                this.eventHandlers.delete(event);
            }
        }
    }

    emit(event, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(event, data);
        } else {
            console.warn(`⚠️ Socket не подключен, событие ${event} не отправлено`);
        }
    }
}

export default new SocketService();