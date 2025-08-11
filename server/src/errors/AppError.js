const {
    DEFAULT_ERROR_STATUS,
    DEFAULT_ERROR_MESSAGE,
    DEFAULT_ERROR_CODE,
} = require('../constants/error');

class AppError extends Error {
    constructor(
        status = DEFAULT_ERROR_STATUS,
        message = DEFAULT_ERROR_MESSAGE,
        code = DEFAULT_ERROR_CODE,
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
