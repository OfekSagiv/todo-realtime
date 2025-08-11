const { Server } = require('socket.io');
const { socketCorsOptions } = require('../config/cors');
const { registerLockHandlers } = require('./handlers/lock.handlers');

let io;

function initSocket(httpServer) {
    io = new Server(httpServer, { cors: socketCorsOptions });

    io.on('connection', (socket) => {
        console.log('WS connected:', socket.id);

        registerLockHandlers(io, socket);

        socket.on('disconnect', () => {
            console.log('WS disconnected:', socket.id);
        });
    });

    return io;
}

function getIO() {
    if (!io) throw new Error('Socket.IO not initialized');
    return io;
}

module.exports = { initSocket, getIO };
