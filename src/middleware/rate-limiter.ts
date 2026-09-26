import { ServiceResponse } from "@/utils/service-response";
import type { Request } from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { StatusCodes } from "http-status-codes";

export const rateLimiter = rateLimit({
    legacyHeaders: true,
    limit: 1000,
    message: ServiceResponse.failure(
        "Too many requests from this IP, please try again after 15 minutes.",
        null,
        StatusCodes.TOO_MANY_REQUESTS,
    ),
    standardHeaders: true,
    windowMs: 15 * 60 * 1000,
    keyGenerator: (req: Request) => ipKeyGenerator(req.ip as string),
});

export const loginLimiter = rateLimit({
    legacyHeaders: true,
    limit: 5,
    message: ServiceResponse.failure(
        "Too many login attempts, please try again later.",
        null,
        StatusCodes.TOO_MANY_REQUESTS,
    ),
    standardHeaders: true,
    windowMs: 15 * 60 * 1000,
    keyGenerator: (req: Request) => ipKeyGenerator(req.ip as string),
});

export const registerLimiter = rateLimit({
    legacyHeaders: true,
    limit: 5,
    message: ServiceResponse.failure(
        "Too many registration attempts, please try again later.",
        null,
        StatusCodes.TOO_MANY_REQUESTS,
    ),
    standardHeaders: true,
    windowMs: 15 * 60 * 1000,
    keyGenerator: (req: Request) => ipKeyGenerator(req.ip as string),
});

export const verificationLimiter = rateLimit({
    legacyHeaders: true,
    limit: 6,
    message: ServiceResponse.failure(
        "Too many verification link attempts. Please try again later.",
        null,
        StatusCodes.TOO_MANY_REQUESTS,
    ),
    standardHeaders: true,
    windowMs: 10 * 60 * 1000,
    keyGenerator: (req: Request) => ipKeyGenerator(req.ip as string),
});
