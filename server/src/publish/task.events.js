const { getIO } = require('../socket');
const EVENTS = require('../constants/socketEvents');

function publishTaskCreated(task) {
    getIO().emit(EVENTS.TASK_CREATED, task);
}
function publishTaskUpdated(task) {
    getIO().emit(EVENTS.TASK_UPDATED, task);
}
function publishTaskDeleted(id) {
    getIO().emit(EVENTS.TASK_DELETED, { id });
}

module.exports = {
    publishTaskCreated,
    publishTaskUpdated,
    publishTaskDeleted,
};
