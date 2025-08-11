const { ENV_VARS } = require('./envVars');

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
        return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
};

const socketCorsOptions = {
    origin: allowedOrigins.length ? allowedOrigins : undefined,
    methods: ['GET','POST','PUT','DELETE'],
    credentials: true,
};

module.exports = { allowedOrigins, expressCorsOptions, socketCorsOptions };
