require('dotenv').config();
const validateEnv = require('./config/validateEnv');
const http = require('http');
const connectDB = require('./db');
const app = require('./app');
const { initSocket } = require('./socket');
const { SERVER_LISTENING, HTTP_SERVER_ERROR, STARTUP_ERROR} = require('./config/messages');
const { DEFAULT_PORT, EXIT_CODE_ERROR } = require('./config/numeric');

validateEnv();

const PORT = Number(process.env.PORT || DEFAULT_PORT);
const MONGO_URI = process.env.MONGO_URI;

(async () => {
    try {
        await connectDB(MONGO_URI);

        const server = http.createServer(app);
        initSocket(server);
        server.on('error', (err) => {
            console.error(HTTP_SERVER_ERROR, err.message);
            process.exit(EXIT_CODE_ERROR);
        });
        server.listen(PORT, () => {
            console.log(SERVER_LISTENING(PORT));
        });
    } catch (err) {
        console.error(STARTUP_ERROR, err.message);
        process.exit(EXIT_CODE_ERROR);
    }
})();
