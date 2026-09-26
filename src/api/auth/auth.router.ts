import { z } from "zod";
import express, { type Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import passport from "passport";
import { createApiResponse } from "@/api-docs/open-api-response-builders";
import {
    googleOAuth,
    login,
    logout,
    register,
    sendVerificationLink,
    verifyEmail,
} from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schema";
import { userDTO } from "@/db/schema";
import { env } from "@/configs/env";
import { StatusCodes } from "http-status-codes";
import { isAuthenticated } from "@/middleware/auth";
import {
    loginLimiter,
    registerLimiter,
    verificationLimiter,
} from "@/middleware/rate-limiter";

export const authRegistry = new OpenAPIRegistry();
export const authRouter: Router = express.Router();

authRouter.get(
    "/google",
    passport.authenticate("google", {
        scope: ["email", "profile"],
        prompt: "consent",
    }),
);

authRouter.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: `${env.CORS_ORIGIN}/login`,
        session: false,
    }),
    googleOAuth,
);

authRegistry.registerPath({
    method: "post",
    path: "/api/auth/register",
    tags: ["Auth"],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: registerSchema,
                },
            },
        },
    },
    responses: createApiResponse(userDTO, "Register Success"),
});

authRouter.post("/register", registerLimiter, register);

authRegistry.registerPath({
    method: "post",
    path: "/api/auth/login",
    tags: ["Auth"],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: loginSchema,
                },
            },
        },
    },
    responses: {
        ...createApiResponse(userDTO, "Login Success"),
        ...createApiResponse(z.null(), "User not found", StatusCodes.NOT_FOUND),
        ...createApiResponse(
            z.null(),
            "Invalid credentials",
            StatusCodes.UNAUTHORIZED,
        ),
    },
});

authRouter.post("/login", loginLimiter, login);

authRegistry.registerPath({
    method: "post",
    path: "/api/auth/logout",
    tags: ["Auth"],
    responses: createApiResponse(z.null(), "Logout Success"),
});

authRouter.post("/logout", isAuthenticated, logout);

authRegistry.registerPath({
    method: "post",
    path: "/api/auth/send-verification-link",
    tags: ["Auth"],
    request: {
        headers: z.object({ "x-current-pathname": z.string().optional() }),
    },
    responses: createApiResponse(z.null(), "Send verification link success"),
});

authRouter.post(
    "/send-verification-link",
    verificationLimiter,
    isAuthenticated,
    sendVerificationLink,
);

authRouter.get("/verify-email", verifyEmail);
