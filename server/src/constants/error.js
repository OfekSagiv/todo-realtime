const DEFAULT_ERROR_STATUS = 500;
const DEFAULT_ERROR_MESSAGE = 'Internal Server Error';
const DEFAULT_ERROR_CODE = 'INTERNAL_ERROR';

const ERROR_CODES = {
    INVALID_ID: 'INVALID_ID',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    DUPLICATE_KEY: 'DUPLICATE_KEY',
    BAD_JSON: 'BAD_JSON',
    INTERNAL_ERROR: DEFAULT_ERROR_CODE,
    NOT_FOUND: 'NOT_FOUND',
    TASK_NOT_FOUND: 'TASK_NOT_FOUND',
};

const ERROR_MESSAGES = {
    INVALID_ID: 'Invalid ID format',
    VALIDATION_ERROR: 'Validation error',
    DUPLICATE_KEY: 'Duplicate key',
    BAD_JSON: 'Invalid JSON body',
    INTERNAL_ERROR: DEFAULT_ERROR_MESSAGE,
    NOT_FOUND: 'Route not found',
    TASK_NOT_FOUND: 'Task not found',
    TASK_TITLE_REQUIRED: 'Task title is required',
    TASK_TITLE_EMPTY: 'Task title cannot be empty',
    TASK_UPDATE_EMPTY: 'At least one field is required for update',
};

module.exports = {
    DEFAULT_ERROR_STATUS,
    DEFAULT_ERROR_MESSAGE,
    DEFAULT_ERROR_CODE,
    ERROR_CODES,
    ERROR_MESSAGES
};
