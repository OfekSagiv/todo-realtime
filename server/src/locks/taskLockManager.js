const {v4: uuidv4} = require('uuid');
const {ERROR_MESSAGES} = require("../constants/error");
const locksByTask = new Map();
const tasksBySocket = new Map();

function acquire(taskId, socketId) {
    const current = locksByTask.get(taskId);
    if (current && current.ownerSocketId !== socketId) {
        return {ok: false, reason: ERROR_MESSAGES.TASK_LOCKED, owner: current.ownerSocketId};
    }
    if (!current) {
        const token = uuidv4();
        const ts = Date.now();
        locksByTask.set(taskId, {ownerSocketId: socketId, token, ts});
    } else {
        locksByTask.set(taskId, current);
    }

    let set = tasksBySocket.get(socketId);
    if (!set) {
        set = new Set();
        tasksBySocket.set(socketId, set);
    }
    set.add(taskId);

    const final = locksByTask.get(taskId);
    return { ok: true, lock: { taskId, owner: final.ownerSocketId, token: final.token } };
}

function release(taskId, socketId, token) {
    const current = locksByTask.get(taskId);
     if (!current) return { ok: false, reason: ERROR_MESSAGES.INVALID_TASK };
     const isOwner = current.ownerSocketId === socketId;
     const tokenMatch = token && current.token === token;
     if (!isOwner && !tokenMatch) return { ok: false, reason: ERROR_MESSAGES.NOT_OWNER };

    locksByTask.delete(taskId);
    const set = tasksBySocket.get(current.ownerSocketId);
    if (set) {
        set.delete(taskId);
        if (set.size === 0) tasksBySocket.delete(current.ownerSocketId);
    }
    return {ok: true, taskId};
}

function releaseAllBySocket(socketId) {
    const set = tasksBySocket.get(socketId);
    if (!set) return [];
    const released = Array.from(set);
    for (const taskId of released) {
        locksByTask.delete(taskId);
    }
    tasksBySocket.delete(socketId);
    return released;
}

 function getLock(taskId) {
       return locksByTask.get(taskId) || null;
     }

 function isLocked(taskId) {
       return locksByTask.has(taskId);
     }

module.exports = {acquire, release, releaseAllBySocket , getLock, isLocked};
