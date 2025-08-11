const locksByTask = new Map();
const tasksBySocket = new Map();

function acquire(taskId, socketId) {
    const current = locksByTask.get(taskId);
    if (current && current !== socketId) {
        return { ok: false, reason: 'ALREADY_LOCKED', owner: current };
    }
    locksByTask.set(taskId, socketId);

    let set = tasksBySocket.get(socketId);
    if (!set) {
        set = new Set();
        tasksBySocket.set(socketId, set);
    }
    set.add(taskId);

    return { ok: true, lock: { taskId, owner: socketId } };
}

function release(taskId, socketId) {
    const current = locksByTask.get(taskId);
    if (!current) return { ok: false, reason: 'INVALID_TASK' };
    if (current !== socketId) return { ok: false, reason: 'NOT_OWNER' };

    locksByTask.delete(taskId);
    const set = tasksBySocket.get(socketId);
    if (set) {
        set.delete(taskId);
        if (set.size === 0) tasksBySocket.delete(socketId);
    }
    return { ok: true, taskId };
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

module.exports = { acquire, release, releaseAllBySocket };
