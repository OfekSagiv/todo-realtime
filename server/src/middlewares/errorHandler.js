const { AppError } = require('../errors/AppError');
const { StatusCodes } = require('http-status-codes');

function mapMongooseError(err) {
    if (err.name === 'CastError') {
        return new AppError(StatusCodes.BAD_REQUEST, 'Invalid ID format', 'INVALID_ID');
    }
    if (err.name === 'ValidationError') {
        const details = Object.values(err.errors).map(e => ({ path: e.path, message: e.message }));
        return new AppError(StatusCodes.BAD_REQUEST, 'Validation error', 'VALIDATION_ERROR', details);
    }
    if (err.name === 'MongoServerError' && err.code === 11000) {
        return new AppError(StatusCodes.CONFLICT, 'Duplicate key', 'DUPLICATE_KEY', { keyValue: err.keyValue });
    }
    return null;
}

module.exports = (err, _req, res, _next) => {
    if (err instanceof AppError) {
        const isProd = process.env.NODE_ENV === 'production';
        return res.status(err.status).json({
            error: {
                code: err.code,
                message: err.message,
                ...(isProd ? {} : { details: err.details, stack: err.stack }),
            },
        });
    }

    const mapped = mapMongooseError(err);
    if (mapped) {
        const isProd = process.env.NODE_ENV === 'production';
        return res.status(mapped.status).json({
            error: {
                code: mapped.code,
                message: mapped.message,
                ...(isProd ? {} : { details: mapped.details }),
            },
        });
    }

    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: { code: 'BAD_JSON', message: 'Invalid JSON body' },
        });
    }

    const isProd = process.env.NODE_ENV === 'production';
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: isProd ? 'Internal server error' : (err.message || 'Internal server error'),
            ...(isProd ? {} : { stack: err.stack }),
        },
    });
};
