import User from "../models/User";
import express from 'express';
import { asyncHandler } from "../utils/asyncHandler";

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let { channelName, email, password } = req.body;

    await User.create({
        channelName,
        email,
        password,
    })
        .then((user) => {
            sendTokenResponse(user, 200, res);
        })
        .catch((err: any) => {
            console.log(err);
            res.status(400).json({ success: false, error: err });
        });

});


const sendTokenResponse = (user: any, statusCode: number, res: express.Response) => {
    const token = user.getSignedJwtToken()

    const options = {
        expires: new Date(
            Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE ?? "30")) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: false
    }

    if (process.env.NODE_ENV === 'production') {
        options.secure = true
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({ success: true, token })
}