const repo = require('../repositories/task.repository');
const { AppError } = require('../errors/AppError');
const { StatusCodes } = require('http-status-codes');

async function getAllTasksService() {
    return repo.findAllTasks();
}

async function getTaskByIdService(id) {
    const task = await repo.findTaskById(id);
    if (!task) throw new AppError(StatusCodes.NOT_FOUND, 'Task not found', 'TASK_NOT_FOUND');
    return task;
}

async function createTaskService(validatedInput) {
    const { title } = validatedInput;
    return repo.createTaskDocument({ title });
}

async function updateTaskService(id, validatedInput) {
    const updated = await repo.updateTaskById(id, validatedInput);
    if (!updated) throw new AppError(StatusCodes.NOT_FOUND, 'Task not found', 'TASK_NOT_FOUND');
    return updated;
}

async function deleteTaskService(id) {
    const deleted = await repo.deleteTaskById(id);
    if (!deleted) throw new AppError(StatusCodes.NOT_FOUND, 'Task not found', 'TASK_NOT_FOUND');
    return { id: deleted._id.toString() };
}

module.exports = {
    getAllTasksService,
    getTaskByIdService,
    createTaskService,
    updateTaskService,
    deleteTaskService,
};
