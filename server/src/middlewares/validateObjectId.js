const mongoose = require('mongoose');
const { AppError } = require('../errors/AppError');
const { StatusCodes } = require('http-status-codes');

module.exports = (req, _res, next) => {
    const { id } = req.params;
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError(StatusCodes.BAD_REQUEST, 'Invalid ID format', 'INVALID_ID'));
    }
    next();
};
