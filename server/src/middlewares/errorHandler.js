const {AppError} = require('../errors/AppError');
const {StatusCodes} = require('http-status-codes');
const {ERROR_CODES, ERROR_MESSAGES} = require('../constants/error');
const {MONGOOSE_ERROR_NAMES, MONGODB_ERROR_CODES} = require('../constants/mongoose');
const { ENV_VALUES} = require('../config/envVars');

function mapMongooseError(err) {
    if (err.name === MONGOOSE_ERROR_NAMES.CAST_ERROR) {
        return new AppError(StatusCodes.BAD_REQUEST, ERROR_MESSAGES.INVALID_ID, ERROR_CODES.INVALID_ID);
    }

    if (err.name === MONGOOSE_ERROR_NAMES.VALIDATION_ERROR) {
        const details = Object.values(err.errors).map(e => ({path: e.path, message: e.message}));
        return new AppError(StatusCodes.BAD_REQUEST, ERROR_MESSAGES.VALIDATION_ERROR, ERROR_CODES.VALIDATION_ERROR, details);
    }

    if (err.name === MONGOOSE_ERROR_NAMES.MONGO_SERVER_ERROR && err.code === MONGODB_ERROR_CODES.DUPLICATE_KEY) {
        return new AppError(StatusCodes.CONFLICT, ERROR_MESSAGES.DUPLICATE_KEY, ERROR_CODES.DUPLICATE_KEY, {keyValue: err.keyValue});
    }

    return null;
}

module.exports = (err, _req, res, _next) => {
    const isProd = process.env.NODE_ENV === ENV_VALUES.PRODUCTION;

    if (err instanceof AppError) {
        return res.status(err.status).json({
            error: {
                code: err.code,
                message: err.message,
                ...(isProd ? {} : {details: err.details, stack: err.stack}),
            },
        });
    }

    const mapped = mapMongooseError(err);
    if (mapped) {
        return res.status(mapped.status).json({
            error: {
                code: mapped.code,
                message: mapped.message,
                ...(isProd ? {} : {details: mapped.details}),
            },
        });
    }

    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: {code: ERROR_CODES.BAD_JSON, message: ERROR_MESSAGES.BAD_JSON},
        });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: isProd ? ERROR_MESSAGES.INTERNAL_ERROR : (err.message || ERROR_MESSAGES.INTERNAL_ERROR),
            ...(isProd ? {} : {stack: err.stack}),
        },
    });
};
