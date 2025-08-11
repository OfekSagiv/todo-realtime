const { StatusCodes } = require('http-status-codes');

module.exports = (schema) => async (req, res, next) => {
    try {
        req.validatedBody = await schema.parseAsync(req.body);
        next();
    } catch (err) {
        const details = err.errors?.map(e => ({
            path: e.path.join('.'),
            message: e.message,
        })) || null;

        res.status(StatusCodes.BAD_REQUEST).json({
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details },
        });
    }
};
