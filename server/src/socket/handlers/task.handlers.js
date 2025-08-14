const EVENTS = require('../../constants/socketEvents');
const { toggleTaskStatusService } = require('../../services/task.service');
const { ERROR_MESSAGES } = require('../../constants/error');
const mongoose = require('mongoose');

function safeAck(ack) {
    return typeof ack === 'function' ? ack : () => {};
}

function registerTaskHandlers(io, socket) {
    socket.on(EVENTS.TASK_TOGGLE_STATUS, async (payload, ackCb) => {
        const ack = safeAck(ackCb);

        try {
            const { taskId } = payload;

            if (!taskId) {
                return ack({ ok: false, error: ERROR_MESSAGES.TASK_ID_REQUIRED });
            }

            if (!mongoose.Types.ObjectId.isValid(taskId)) {
                return ack({ ok: false, error: ERROR_MESSAGES.INVALID_ID });
            }

            const updatedTask = await toggleTaskStatusService(taskId);

            return ack({ ok: true, task: updatedTask });

        } catch (error) {
            console.error('Toggle task status error:', error);
            return ack({
                ok: false,
                error: error.message || ERROR_MESSAGES.TASK_TOGGLE_FAILED
            });
        }
    });
}

module.exports = { registerTaskHandlers };
