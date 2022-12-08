/// <reference path="../../types/index.d.ts" />

import express from 'express';
import { UserModel } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { ErrorResponse } from '../utils/errorResponse';
import jwt, { JwtPayload } from 'jsonwebtoken';

export const protect = asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let token: string | null = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }

    // Set token from cookie
    // else if (req.cookies.token) {
    //   token = req.cookies.token
    // }

    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401))
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "secret") as JwtPayload

        req.user = await UserModel.findById(decoded.id).populate('subscribers').orFail()
        next()
    } catch (err) {
        console.log(err)
        return next(new ErrorResponse('Not authorized to access this route', 401))
    }
})

export const authorize = (...roles: string[]) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorResponse(
                    `User role ${req.user.role} is not authorized to access this route`,
                    403
                )
            )
        }
        next()
    }
}