const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const tasksRouter = require('./routes/task.router');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/tasks', tasksRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
