const router = require('express').Router();
const controller = require('../controllers/task.controller');
const validateObjectId = require('../middlewares/validateObjectId');
const validateBody = require('../middlewares/validateBody');
const verifyTaskLock = require('../middlewares/verifyTaskLock');
const { createTaskSchema, updateTaskSchema } = require('../validations/task.validation');

router.get('/', controller.getAllTasksController);
router.get('/:id', validateObjectId, controller.getTaskByIdController);

router.post('/', validateBody(createTaskSchema), controller.createTaskController);
router.put('/:id', validateObjectId, verifyTaskLock, validateBody(updateTaskSchema), controller.updateTaskController);

router.delete('/:id', validateObjectId, verifyTaskLock, controller.deleteTaskController);

module.exports = router;
