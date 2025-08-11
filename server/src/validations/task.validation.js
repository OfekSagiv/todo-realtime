const { z } = require('zod');
const { ERROR_MESSAGES } = require('../constants/error');

const createTaskSchema = z.object({
    title: z.string().trim().min(1, ERROR_MESSAGES.TASK_TITLE_REQUIRED),
});

const updateTaskSchema = z.object({
    title: z.string().trim().min(1, ERROR_MESSAGES.TASK_TITLE_EMPTY).optional(),
    completed: z.boolean().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: ERROR_MESSAGES.TASK_UPDATE_EMPTY }
);

module.exports = {
    createTaskSchema,
    updateTaskSchema,
};
