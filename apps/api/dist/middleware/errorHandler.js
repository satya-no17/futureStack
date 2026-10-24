"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
function errorHandler(err, req, res, next) {
    console.error('[API Error]:', err);
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            error: 'Validation failed',
            details: err.errors.map(e => ({
                path: e.path.join('.'),
                message: e.message
            }))
        });
        return;
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    res.status(statusCode).json({
        error: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}
