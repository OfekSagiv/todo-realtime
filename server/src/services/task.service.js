const repo = require('../repositories/task.repository');
const {AppError} = require('../errors/AppError');
const {StatusCodes} = require('http-status-codes');
const {ERROR_CODES, ERROR_MESSAGES} = require('../constants/error');
const {
    publishTaskCreated,
    publishTaskUpdated,
    publishTaskDeleted,
} = require('../publish/task.events');

async function getAllTasksService() {
    return repo.findAllTasks();
}

async function getTaskByIdService(id) {
    const task = await repo.findTaskById(id);
    if (!task) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_MESSAGES.TASK_NOT_FOUND,
            ERROR_CODES.TASK_NOT_FOUND
        );
    }
    return task;
}

async function createTaskService(validatedInput) {
    const {title} = validatedInput;
    const created = await repo.createTaskDocument({title});
    publishTaskCreated(created);
    return created;
}

async function updateTaskService(id, validatedInput) {
    const updated = await repo.updateTaskById(id, validatedInput);
    if (!updated) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_MESSAGES.TASK_NOT_FOUND,
            ERROR_CODES.TASK_NOT_FOUND
        );
    }
    publishTaskUpdated(updated);
    return updated;
}

async function deleteTaskService(id) {
    const deleted = await repo.deleteTaskById(id);
    if (!deleted) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_MESSAGES.TASK_NOT_FOUND,
            ERROR_CODES.TASK_NOT_FOUND
        );
    }
    const deletedId = deleted._id.toString();
    publishTaskDeleted(deletedId);
    return {id: deletedId};
}

async function toggleTaskStatusService(id) {
    const task = await repo.findTaskById(id);
    if (!task) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_MESSAGES.TASK_NOT_FOUND,
            ERROR_CODES.TASK_NOT_FOUND
        );
    }

    const updated = await repo.updateTaskById(id, { completed: !task.completed });
    publishTaskUpdated(updated);
    return updated;
}

module.exports = {
    getAllTasksService,
    getTaskByIdService,
    createTaskService,
    updateTaskService,
    deleteTaskService,
    toggleTaskStatusService,
};
