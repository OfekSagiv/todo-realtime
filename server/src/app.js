const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

module.exports = app;
