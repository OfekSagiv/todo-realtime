const mongoose = require('mongoose');
const { DB_CONNECTED, DB_ERROR, DATABASE_CONNECTION_FAILED } = require('./config/messages');
const { EXIT_CODE_ERROR } = require('./config/numeric');
const { ENV_VARS, ENV_VALUES } = require('./config/envVars');

async function connectDB(uri) {
    try {
        await mongoose.connect(uri);
        console.log(DB_CONNECTED);
    } catch (err) {
        const isProduction = process.env[ENV_VARS.NODE_ENV] === ENV_VALUES.PRODUCTION;
        if (isProduction) {
            console.error(DB_ERROR, DATABASE_CONNECTION_FAILED);
        } else {
            console.error(DB_ERROR, err.message);
        }
        process.exit(EXIT_CODE_ERROR);
    }
}

module.exports = connectDB;
