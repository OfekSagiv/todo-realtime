const EVENTS = require('../../constants/socketEvents');
const {REASONS, LOCK_OK} = require('../../constants/lock');
const {lockAcquireSchema, lockReleaseSchema} = require('../../validations/lock.validation');
const LockManager = require('../../locks/taskLockManager');
const {taskRoom} = require('../../constants/socketRooms');

function safeAck(ack) {
    return typeof ack === 'function' ? ack : () => {
    };
}

function registerLockHandlers(io, socket) {
    socket.on(EVENTS.LOCK_ACQUIRE, async (payload, ackCb) => {
        const ack = safeAck(ackCb);
        try {
            const {taskId} = await lockAcquireSchema.parseAsync(payload);
            const res = LockManager.acquire(taskId, socket.id);
            if (!res.ok) return ack({ok: false, reason: res.reason, owner: res.owner});
            await socket.join(taskRoom(taskId));
            io.to(taskRoom(taskId)).emit(EVENTS.TASK_LOCKED, {taskId, owner: socket.id});
            return ack({ok: true, lock: res.lock});
        } catch (_err) {
            return ack({ok: false, reason: REASONS.BAD_PAYLOAD});
        }
    });

    socket.on(EVENTS.LOCK_RELEASE, async (payload, ackCb) => {
        const ack = safeAck(ackCb);
        try {
            const {taskId, token} = await lockReleaseSchema.parseAsync(payload);
            const res = LockManager.release(taskId, socket.id, token);
            if (!res.ok) return ack({ok: false, reason: res.reason});
            await socket.leave(taskRoom(taskId));
            io.to(taskRoom(taskId)).emit(EVENTS.TASK_UNLOCKED, {taskId});
            return ack({ok: true, message: LOCK_OK, taskId});
        } catch (_err) {
            return ack({ok: false, reason: REASONS.BAD_PAYLOAD});
        }
    });
    socket.on('disconnect', () => {
        const released = LockManager.releaseAllBySocket(socket.id);
        for (const taskId of released) {
            io.to(taskRoom(taskId)).emit(EVENTS.TASK_UNLOCKED, {taskId});
        }
    });
}

module.exports = {registerLockHandlers};
