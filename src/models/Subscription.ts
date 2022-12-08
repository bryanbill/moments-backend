import mongoose from "mongoose";
import { DocumentType, getModelForClass, modelOptions, prop, queryMethod } from '@typegoose/typegoose';
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

@modelOptions({ schemaOptions: { timestamps: true } })
export class Subscriptions extends TimeStamps {
    @prop({ required: true, unique: true, uniqueCaseInsensitive: true, ref: 'User' })
    subscriberId!: mongoose.Types.ObjectId;

    @prop({ required: true, unique: true, uniqueCaseInsensitive: true, ref: 'User' })
    channelId!: mongoose.Types.ObjectId;
}

export type SubscriptionDoc = DocumentType<Subscriptions>;
export const SubscriptionModel = getModelForClass(Subscriptions);