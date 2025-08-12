const { StatusCodes } = require('http-status-codes');
const LockManager = require('../locks/taskLockManager');
const { X_LOCK_TOKEN } = require('../constants/headers');
const { ERROR_CODES, ERROR_MESSAGES } = require('../constants/error');

module.exports = (req, res, next) => {
    const { id: taskId } = req.params;
    if (!taskId) return next();

    const lock = LockManager.getLock(taskId);
    if (!lock) return next();

    const token = req.get(X_LOCK_TOKEN);
    if (token && token === lock.token) return next();

    return res.status(StatusCodes.LOCKED).json({
        error: { code: ERROR_CODES.LOCKED, message: ERROR_MESSAGES.TASK_LOCKED },
    });
};
