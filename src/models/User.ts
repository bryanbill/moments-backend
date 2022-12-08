import mongoose from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import { iUser } from "../interfaces/iUser"
import { TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import { DocumentType, getModelForClass, index, modelOptions, plugin, pre, prop, types } from '@typegoose/typegoose';
import { gravatarURL } from "../utils/helpers";


interface QueryHelpers {
    matchPassword(enteredPassword: string): Promise<boolean>;
    getSignedJwtToken(): string;
    getResetPasswordToken(): string;
}



@index({
    channelName: 'text'
})
@plugin(uniqueValidator, { message: '{PATH} already exists' })
@modelOptions({ schemaOptions: { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } } })
@pre('find', function () {
    this.populate({ path: 'subscribers' })
})
@pre<User>('save', async function (next) {
    if (!this.isModified('password')) {
        next()
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})
class User extends TimeStamps {
    @prop({ required: true, unique: true, uniqueCaseInsensitive: true })
    id!: string;

    @prop({ required: true, unique: true, uniqueCaseInsensitive: true })
    channelName!: string

    @prop({ required: true, unique: true, uniqueCaseInsensitive: true, match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/ })
    email!: string;

    @prop({ default: 'no-photo.jpg' })
    photoUrl!: string;

    @prop({ enum: ['user', 'admin'], default: 'user' })
    role!: string;

    @prop({ required: true, minlength: 6, select: false })
    password!: string;

    @prop({})
    resetPasswordToken?: string;

    @prop({ default: Date.now() })
    resetPasswordExpire?: Date;

    get gravatar() {
        return gravatarURL(this.email);
    }

    async matchPassword(enteredPassword: string) {
        return await bcrypt.compare(enteredPassword, this.password)
    }

    get getResetPasswordToken() {
        const resetToken = crypto.randomBytes(20).toString('hex')

        this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

        this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000)

        return resetToken
    }

    get getSignedJwtToken() {
        return jwt.sign({ id: this.id }, process.env.JWT ?? "", {
            expiresIn: process.env.JWT_EXPIRE
        })
    }

}

export type UserDoc = DocumentType<User>;
export const UserModel = getModelForClass(User);
