/// <reference path="../../types/index.d.ts" />

import { UserModel, UserDoc } from "../models/User";
import express from 'express';
import { asyncHandler } from "../utils/asyncHandler";
import { ErrorResponse } from "../utils/errorResponse";
import crypto from 'crypto';
import { UploadedFile } from "express-fileupload";
import path from 'path';

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let { channelName, email, password } = req.body;

    await UserModel.create({
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

export const login = asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let { email, password } = req.body

    if (!email || !password) {
        return next(new ErrorResponse('Please provide an email and password', 400))
    }

    email = email.toLowerCase()

    const user = await UserModel.findOne({ email }).select('+password')

    if (!user) {
        return next(new ErrorResponse('Invalid credentials', 400))
    }

    const isMatch = await user.matchPassword(password)

    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 400))
    }

    sendTokenResponse(user, 200, res)
})

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    })

    res.status(200).json({ success: true, data: {} })
})

// @desc    Get current logged in user
// @route   POST /api/v1/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const user = req.user
        res.status(200).json({ success: true, data: user })
    } catch (err) {
        console.log(err)
        res.status(400).json({ success: false, error: err })
    }
})

// @desc    Update user details
// @route   POST /api/v1/auth/updatedetails
// @access  Private
export const updateDetails = asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const fieldsToUpdate = {
        channelName: req.body.channelName,
        email: req.body.email.toLowerCase()
    }
    const user = await UserModel.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true,
        context: 'query'
    })

    res.status(200).json({ success: true, data: user })
})

// @desc    Upload avatar
// @route   PUT /api/v1/users
// @access  Private
export const uploadChannelAvatar = asyncHandler(async (req: any, res: express.Response, next: express.NextFunction) => {
    if (!req.files) {
        return next(new ErrorResponse(`Please upload a file`, 404))
    }

    const file = (req.files.avatar as UploadedFile)

    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload an image file`, 404))
    }

    if (file.size > parseInt(process.env.MAX_FILE_UPLOAD ?? '1000000000000000000000')) {
        return next(
            new ErrorResponse(
                `Please upload an image less than ${parseInt(process.env.MAX_FILE_UPLOAD ?? '1000000000000000000000') / 1000 / 1000
                }mb`,
                404
            )
        )
    }

    file.name = `avatar-${req.user._id}${path.parse(file.name).ext}`

    file.mv(
        `${process.env.FILE_UPLOAD_PATH}/avatars/${file.name}`,
        async (err) => {
            if (err) {
                console.error(err)
                return next(new ErrorResponse(`Problem with file upload`, 500))
            }

            // await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name })
            req.user.photoUrl = file.name
            await req.user.save()
            res.status(200).json({ success: true, data: file.name })
        }
    )
})

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
export const updatePassword = asyncHandler(async (req: any, res: express.Response, next: express.NextFunction) => {
    const user = await UserModel.findById(req.user.id).select('+password').orFail()

    if (!(await user.matchPassword(req.body.currentPassword))) {
        // return next(new ErrorResponse('Password is incorrect', 401))
        return res.status(400).json({
            success: false,
            error: [
                { field: 'currentPassword', message: 'Current password is incorrect' }
            ]
        })
    }

    user!.password = req.body.newPassword
    await user?.save()

    sendTokenResponse(user, 200, res)
})

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
export const forgotPassword = asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = await UserModel.findOne({ email: req.body.email.toLowerCase() })

    if (!user) {
        return next(new ErrorResponse('There is no user with that email', 404))
    }

    const resetToken = user.getResetPasswordToken

    await user.save({ validateBeforeSave: false })

    const resetUrl = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/auth/resetpassword/${resetToken}`

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`

    try {
        // Send mail here
        res.status(200).json({ success: true, data: 'Email sent' })
    } catch (err) {
        console.log(err)
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        await user.save({ validateBeforeSave: false })

        return next(new ErrorResponse('Email could not be sent', 500))
    }
})

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = asyncHandler(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex')

    console.log(resetPasswordToken)

    const user = await UserModel.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user) {
        return next(new ErrorResponse('Invalid token', 400))
    }

    // Set new password
    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    sendTokenResponse(user, 200, res)
})



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