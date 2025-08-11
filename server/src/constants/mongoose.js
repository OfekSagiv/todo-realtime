const MONGOOSE_ERROR_NAMES = {
    CAST_ERROR: 'CastError',
    VALIDATION_ERROR: 'ValidationError',
    MONGO_SERVER_ERROR: 'MongoServerError'
};

const MONGODB_ERROR_CODES = {
    DUPLICATE_KEY: 11000
};

module.exports = {
    MONGOOSE_ERROR_NAMES,
    MONGODB_ERROR_CODES
};
