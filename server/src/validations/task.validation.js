const { z } = require('zod');

const createTaskSchema = z.object({
    title: z.string().trim().min(1, 'Title is required'),
});

const updateTaskSchema = z.object({
    title: z.string().trim().min(1, 'Title cannot be empty').optional(),
    completed: z.boolean().optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided' }
);

module.exports = {
    createTaskSchema,
    updateTaskSchema,
};
