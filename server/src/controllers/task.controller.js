const service = require('../services/task.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { StatusCodes } = require('http-status-codes');

const getAllTasksController = asyncHandler(async (_req, res) => {
    const tasks = await service.getAllTasksService();
    res.status(StatusCodes.OK).json(tasks);
});

const getTaskByIdController = asyncHandler(async (req, res) => {
    const task = await service.getTaskByIdService(req.params.id);
    res.status(StatusCodes.OK).json(task);
});

const createTaskController = asyncHandler(async (req, res) => {
    const task = await service.createTaskService(req.validatedBody);
    res.status(StatusCodes.CREATED).json(task);
});

const updateTaskController = asyncHandler(async (req, res) => {
    const task = await service.updateTaskService(req.params.id, req.validatedBody);
    res.status(StatusCodes.OK).json(task);
});

const deleteTaskController = asyncHandler(async (req, res) => {
    const { id } = await service.deleteTaskService(req.params.id);
    res.status(StatusCodes.OK).json({ id });
});

module.exports = {
    getAllTasksController,
    getTaskByIdController,
    createTaskController,
    updateTaskController,
    deleteTaskController,
};
