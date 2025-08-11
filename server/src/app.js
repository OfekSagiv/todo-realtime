const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRouter = require('./routes/api.router');
const morgan = require('morgan');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const {API_BASE} = require("./constants/routes");


const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use(API_BASE, apiRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
