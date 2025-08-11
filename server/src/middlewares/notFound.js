const { StatusCodes } = require('http-status-codes');
const { ERROR_CODES, ERROR_MESSAGES } = require('../constants/error');

module.exports = (req, res, _next) => {
    res.status(StatusCodes.NOT_FOUND).json({
        error: {
            code: ERROR_CODES.NOT_FOUND,
            message: `${ERROR_MESSAGES.NOT_FOUND} (${req.method} ${req.originalUrl})`,
        },
    });
};
