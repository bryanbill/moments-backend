import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import colors from 'colors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import fileUpload from 'express-fileupload';
import helmet from 'helmet';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { DBconnection } from './config/db';

dotenv.config({ path: './config/.env' });
DBconnection();

// Routes

// App

const app = express();
app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// File uploading
app.use(
    fileUpload({
        createParentPath: true,
    })
);

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Enable CORS
app.use(
    cors({
        origin: "*",
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 100 // 100 request per 10 mins
})

app.use(limiter)

// Prevent http param pollution
app.use(hpp());

app.use(express.static(path.join(__dirname, "public")));


const versionOne = (routeName: string) => `/api/v1/${routeName}`;