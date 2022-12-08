import mongoose from 'mongoose';
import { UserDoc } from '../src/models/User';
import { Request } from 'express';
declare global {
    namespace Express {
        interface User extends UserDocument {
        }

        interface Request {

            user: UserDoc;
        }
    }
}

declare module 'express-serve-static-core' {
    export interface ParamsDictionary {
        [key: string]: string | number | mongoose.Types.ObjectId;
    }
}
