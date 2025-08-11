const router = require('express').Router();
const tasksRouter = require('./task.router');
const { TASKS_BASE } = require('../constants/routes');

router.use(TASKS_BASE, tasksRouter);

module.exports = router;
