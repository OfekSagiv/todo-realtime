const { StatusCodes } = require('http-status-codes');
const { ERROR_CODES, ERROR_MESSAGES } = require('../constants/error');

module.exports = (schema) => async (req, res, next) => {
    try {
        req.validatedBody = await schema.parseAsync(req.body);
        next();
    } catch (err) {
        const details =
            err?.errors?.map(e => ({
                path: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
                message: e.message,
            })) || null;

        return res.status(StatusCodes.BAD_REQUEST).json({
            error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: ERROR_MESSAGES.VALIDATION_ERROR,
                details,
            },
        });
    }
};
