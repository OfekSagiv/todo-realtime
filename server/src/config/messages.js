module.exports = {
    DB_CONNECTED: 'Connected to MongoDB Atlas',
    SERVER_LISTENING: (port) => `API listening on http://localhost:${port}`,

    ENV_MISSING: (name) => `Missing required environment variable: ${name}`,
    ENV_PORT_INVALID: 'PORT must be a positive number',
    MISSING_MONGO_URI: 'Missing MONGO_URI in environment',
    DB_ERROR: 'MongoDB connection error:',
    HTTP_SERVER_ERROR: 'HTTP server error:',
    STARTUP_ERROR: 'Startup error:',
    ENV_ORIGIN_INVALID: 'CLIENT_ORIGIN cannot be "*" for security reasons',
};
