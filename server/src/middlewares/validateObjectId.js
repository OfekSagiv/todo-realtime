const mongoose = require('mongoose');
const {AppError} = require('../errors/AppError');
const {StatusCodes} = require('http-status-codes');
const {ERROR_CODES, ERROR_MESSAGES} = require('../constants/error');

module.exports = (req, _res, next) => {
    const {id} = req.params;
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return next(
            new AppError(
                StatusCodes.BAD_REQUEST,
                ERROR_MESSAGES.INVALID_ID,
                ERROR_CODES.INVALID_ID
            )
        );
    }
    return next();
};
