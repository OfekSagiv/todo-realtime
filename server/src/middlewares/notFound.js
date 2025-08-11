const { StatusCodes } = require('http-status-codes');

module.exports = (req, res, _next) => {
    res.status(StatusCodes.NOT_FOUND).json({
        error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
    });
};
