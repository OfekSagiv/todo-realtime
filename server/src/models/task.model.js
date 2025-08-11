const { Schema, model } = require('mongoose');
const { MODEL_NAMES, COLLECTION_NAMES } = require('../constants/models');

const TaskSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        completed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = model(MODEL_NAMES.TASK, TaskSchema, COLLECTION_NAMES.TASKS);
