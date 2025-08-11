class AppError extends Error {
    constructor(
        status = 500,
        message = 'Internal Server Error',
        code = 'INTERNAL_ERROR',
        details = null
    ) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
        this.name = this.constructor.name;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
module.exports = { AppError };
