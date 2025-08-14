const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRouter = require('./routes/api.router');
const morgan = require('morgan');
const { expressCorsOptions } = require('./config/cors');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const { API_BASE } = require("./constants/routes");
const { swaggerUi, swaggerDocument, swaggerOptions } = require('./config/swagger');

const app = express();

app.use(cors(expressCorsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

app.get('/', (req, res) => {
    res.redirect('/api-docs');
});


app.use(API_BASE, apiRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
