const { z } = require('zod');

const lockAcquireSchema = z.object({
    taskId: z.string().min(1, 'taskId is required'),
});

const lockReleaseSchema = z.object({
    taskId: z.string().min(1, 'taskId is required'),
});

module.exports = { lockAcquireSchema, lockReleaseSchema };
