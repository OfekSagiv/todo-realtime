const { ENV_VARS } = require('./envVars');
const { ENV_MISSING, ENV_PORT_INVALID, ENV_ORIGIN_INVALID } = require('./messages');

function validateEnv() {
    const requiredVars = [ENV_VARS.MONGO_URI, ENV_VARS.PORT, ENV_VARS.CLIENT_ORIGIN];

    requiredVars.forEach((name) => {
        if (!process.env[name]) {
            throw new Error(ENV_MISSING(name));
        }
    });

    const port = Number(process.env[ENV_VARS.PORT]);
    if (isNaN(port) || port <= 0) {
        throw new Error(ENV_PORT_INVALID);
    }

    if (process.env[ENV_VARS.CLIENT_ORIGIN] === '*') {
        throw new Error(ENV_ORIGIN_INVALID);
    }
}

module.exports = validateEnv;
