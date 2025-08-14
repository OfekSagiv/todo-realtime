const { Server } = require('socket.io');
const { socketCorsOptions } = require('../config/cors');
const { registerLockHandlers } = require('./handlers/lock.handlers');
const { registerTaskHandlers } = require('./handlers/task.handlers');
const {ERROR_MESSAGES} = require("../constants/error");
const {WS_DISCONNECTED, WS_CONNECTED, SOCKET_CONNECT, SOCKET_DISCONNECT} = require("../constants/socketEvents");

let io;

function initSocket(httpServer) {
    io = new Server(httpServer, { cors: socketCorsOptions });

    io.on(SOCKET_CONNECT, (socket) => {
        console.log(WS_CONNECTED, socket.id);

        registerLockHandlers(io, socket);
        registerTaskHandlers(io, socket);

        socket.on(SOCKET_DISCONNECT, () => {
            console.log(WS_DISCONNECTED, socket.id);
        });
    });

    return io;
}

function getIO() {
    if (!io) throw new Error(ERROR_MESSAGES.SOCKET_NOT_INITIALIZED);
    return io;
}

module.exports = { initSocket, getIO };
