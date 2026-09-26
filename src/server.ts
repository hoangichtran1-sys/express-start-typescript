import express, { type Express } from "express";
import path from "node:path";
import fs from "fs";
import { pino } from "pino";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import { createRouteHandler } from "uploadthing/express";

import "@/configs/passport";
import { env } from "@/configs/env";
import { uploadRouter } from "@/configs/uploadthing";
import { rateLimiter } from "@/middleware/rate-limiter";
import requestLogger from "@/middleware/request-logger";
import { errorHandler } from "@/middleware/error-handler";
import { notFoundHandler } from "@/middleware/not-found-handler";

import { healthCheckRouter } from "@/api/health-check/router";
import { openAPIRouter } from "@/api-docs/open-api-router";
import { authRouter } from "@/api/auth/auth.router";
import { usersRouter } from "@/api/users/users.router";

const logDir = path.join(process.cwd(), "src/storage/log");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logger = pino({
    name: "server start",
    level: "info",
    transport: {
        targets: [
            {
                target: "pino-pretty",
                options: { colorize: true },
            },
            {
                target: "pino/file",
                options: {
                    destination: path.join(
                        logDir,
                        `express-${new Date().toISOString().split("T")[0]}.log`,
                    ),
                    mkdir: true,
                    sync: false,
                },
            },
        ],
    },
});
const app: Express = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
    }),
);
app.use(compression());
app.use(cookieParser(env.COOKIE_SECRET));
app.use(helmet());
app.use(rateLimiter);

app.use(requestLogger);

app.use("/api/health-check", healthCheckRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use(
    "/api/uploadthing",
    createRouteHandler({
        router: uploadRouter,
        config: {
            token: env.UPLOADTHING_TOKEN,
            callbackUrl: `${env.APP_URL}/api/uploadthing`,
        },
    }),
);

app.use(notFoundHandler);

app.use(openAPIRouter);

app.use(errorHandler);

export { app, logger };
