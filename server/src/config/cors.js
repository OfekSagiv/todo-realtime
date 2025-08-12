const { ENV_VARS } = require('./envVars');
const {ERROR_MESSAGES} = require("../constants/error");
const {HTTP_METHODS} = require("../constants/httpMethods");

function parseOrigins(raw) {
    return (raw || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}

const allowedOrigins = parseOrigins(process.env[ENV_VARS.CLIENT_ORIGIN]);

const expressCorsOptions = {
    origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(ERROR_MESSAGES.CORS_ERROR));
    },
    credentials: true,
};

const socketCorsOptions = {
    origin: allowedOrigins.length ? allowedOrigins : undefined,
    methods: HTTP_METHODS,
    credentials: true,
};

module.exports = { allowedOrigins, expressCorsOptions, socketCorsOptions };
