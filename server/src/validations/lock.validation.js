const {z} = require('zod');
const {ERROR_MESSAGES} = require("../constants/error");

const lockAcquireSchema = z.object({
    taskId: z.string().min(1, ERROR_MESSAGES.TASK_ID_REQUIRED),
});

const lockReleaseSchema = z.object({
    taskId: z.string().min(1, ERROR_MESSAGES.TASK_ID_REQUIRED),
    token: z.uuid().optional(),
});

module.exports = {lockAcquireSchema, lockReleaseSchema};
