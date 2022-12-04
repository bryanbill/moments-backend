import express from 'express';

export const protect = asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let token: string;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }
})