import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.userId = null;
        this.userRole = null;
        this.eventHandlers = new Map();
    }

    connect(userData) {
        if (!this.socket) {
            this.socket = io('http://localhost:3000', {
                transports: ['websocket'],
                autoConnect: true,
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            this.socket.on('connect', () => {
                console.log('Socket.IO подключен');
                this.isConnected = true;
                
                if (userData && userData.userId) {
                    this.authenticate(userData);
                }
            });

            this.socket.on('disconnect', () => {
                console.log('Socket.IO отключен');
                this.isConnected = false;
            });

            this.socket.on('connect_error', (error) => {
                console.error('Ошибка подключения Socket.IO:', error);
                this.isConnected = false;
            });
            
            this.socket.on('authenticated', (data) => {
                console.log('Аутентификация успешна:', data);
                this.userId = data.userId;
                this.userRole = data.userRole;
            });
        }
        return this.socket;
    }

    authenticate(userData) {
        if (this.socket && this.isConnected) {
            this.socket.emit('authenticate', userData);
        }
    }

    disconnect() {
        if (this.socket) {
            // Удаляем все обработчики
            for (const [event, handler] of this.eventHandlers) {
                this.socket.off(event, handler);
            }
            this.eventHandlers.clear();
            
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.userId = null;
            this.userRole = null;
        }
    }

    getSocket() {
        return this.socket;
    }

    on(event, callback) {
        if (this.socket) {
            // Сохраняем обработчик для возможности удаления
            if (!this.eventHandlers.has(event)) {
                this.eventHandlers.set(event, []);
            }
            this.eventHandlers.get(event).push(callback);
            this.socket.on(event, callback);
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
            console.warn(`Socket не подключен, событие ${event} не отправлено`);
        }
    }
    
}

export default new SocketService();