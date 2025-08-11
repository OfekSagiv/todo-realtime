const mongoose = require('mongoose');
const { DB_CONNECTED, DB_ERROR } = require('./config/messages');
const {EXIT_CODE_ERROR} = require("./config/numeric");

async function connectDB(uri) {
    try {
        await mongoose.connect(uri);
        console.log(`${DB_CONNECTED}`);
    } catch (err) {
        console.error(`${DB_ERROR}`, err.message);
        process.exit(EXIT_CODE_ERROR);
    }
}

module.exports = connectDB;
