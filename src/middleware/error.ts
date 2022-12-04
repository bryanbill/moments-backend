import { ErrorResponse } from "utils/errorResponse"
import express from 'express';
const errorHandler = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    let error = {
        ...err
    }

    error.message = err.message

    // console.log(err.stack.red);
    console.log(err)

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        // const message = `Resource not found with id of ${err.value}`;
        const message = `Resource not found`
        error = new ErrorResponse(message, 404)
    }
    // console.log(err.name);

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered'
        console.log(err)
        error = new ErrorResponse(message, 400)
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = [{
            field: '',
            message: ''
        }]
        Object.values(err.errors).forEach(errr => {
            message.push({
                field: err.properties.path,
                message: err.message
            })
        })
        error = new ErrorResponse('Empty', 400, message)
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.messageWithField || error.message || 'Server Error'
    })
}
