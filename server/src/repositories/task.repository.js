const Task = require('../models/task.model');

function findAllTasks() {
    return Task.find().sort({ createdAt: -1 });
}

function findTaskById(id) {
    return Task.findById(id);
}

function createTaskDocument(data) {
    return Task.create(data);
}

function updateTaskById(id, data) {
    return Task.findByIdAndUpdate(id, data, { new: true, runValidators: true });
}

function deleteTaskById(id) {
    return Task.findByIdAndDelete(id);
}

module.exports = {
    findAllTasks,
    findTaskById,
    createTaskDocument,
    updateTaskById,
    deleteTaskById,
};
