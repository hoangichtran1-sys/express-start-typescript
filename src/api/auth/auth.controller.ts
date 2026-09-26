import { addHours } from "date-fns";
import { eq } from "drizzle-orm";
import { StatusCodes } from "http-status-codes";
import { type Profile } from "passport-google-oauth20";
import type { NextFunction, Request, Response } from "express";

import { asyncHandler } from "@/utils/async-handler";
import { ApiError } from "@/utils/api-error";
import { ServiceResponse } from "@/utils/service-response";
import { env } from "@/configs/env";
import { COOKIE_NAME, SESSION_MAX_AGE } from "@/constants";
import { db } from "@/configs/db";
import { sessions, userDTO, users } from "@/db/schema";

import { loginSchema, registerSchema, verifyQuerySchema } from "./auth.schema";
import { AuthService } from "./auth.service";

export const googleOAuth = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const data = req.user as Profile | undefined;
        const user = data?._json;

        if (!user || !data) {
            return next(ApiError.unauthorized("Authenticated failed!"));
        }

        const userInfo = {
            provider: data?.provider,
            providerId: user.sub,
            name: user.name,
            email: user.email,
            isEmailVerified: user.email_verified,
            avatar: user.picture,
        };

        //? save the data into your databases
        return await db.transaction(async (tx) => {
            const [existingUser] = await tx
                .select()
                .from(users)
                .where(eq(users.email, userInfo.email!));

            if (existingUser) {
                const [sessionCreated] = await tx
                    .insert(sessions)
                    .values({
                        userId: existingUser.id,
                        expiresAt: addHours(new Date(), 10),
                        remember: true,
                    })
                    .returning();

                if (!sessionCreated) {
                    throw ApiError.notFound("Failed to create session");
                }

                return res
                    .cookie(COOKIE_NAME, sessionCreated.id, {
                        domain: env.HOST,
                        path: "/",
                        maxAge: SESSION_MAX_AGE,
                        secure: env.isProduction ? true : false,
                        httpOnly: true,
                        sameSite: "lax",
                        signed: true,
                    })
                    .redirect(`${env.CORS_ORIGIN}/`);
            } else {
                const [userCreated] = await tx
                    .insert(users)
                    .values({
                        email: userInfo.email!,
                        name: userInfo.name ? userInfo.name : null,
                        emailVerifiedAt: userInfo.isEmailVerified
                            ? new Date()
                            : null,
                        imageUrl: userInfo.avatar ? userInfo.avatar : null,
                        role:
                            userInfo.email === env.EMAIL_ADMIN
                                ? "admin"
                                : "user",
                    })
                    .returning();

                if (!userCreated) {
                    throw ApiError.badRequest("Failed to create user");
                }

                const [sessionCreated] = await tx
                    .insert(sessions)
                    .values({
                        userId: userCreated.id,
                        expiresAt: addHours(new Date(), 10),
                        remember: true,
                    })
                    .returning();

                if (!sessionCreated) {
                    throw ApiError.notFound("Failed to create session");
                }

                return res
                    .cookie(COOKIE_NAME, sessionCreated.id, {
                        domain: env.HOST,
                        path: "/",
                        maxAge: SESSION_MAX_AGE,
                        secure: env.isProduction ? true : false,
                        httpOnly: true,
                        sameSite: "lax",
                        signed: true,
                    })
                    .redirect(`${env.CORS_ORIGIN}/`);
            }
        });
    },
);

export const register = asyncHandler(async (req: Request, res: Response) => {
    const body = registerSchema.parse({ ...req.body });

    const { userCreated, sessionCreated } = await AuthService.register(body);

    const userResponse = userDTO.parse(userCreated);

    const serviceResponse = ServiceResponse.success(
        "Register successfully",
        userResponse,
        StatusCodes.CREATED,
    );

    res.status(serviceResponse.statusCode)
        .cookie(COOKIE_NAME, sessionCreated.id, {
            domain: env.HOST,
            path: "/",
            maxAge: SESSION_MAX_AGE,
            secure: env.isProduction ? true : false,
            httpOnly: true,
            sameSite: "lax",
            signed: true,
        })
        .send(serviceResponse);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const body = loginSchema.parse({ ...req.body });

    const { existingUser, sessionCreated } = await AuthService.login(body);

    const userResponse = userDTO.parse(existingUser);

    const serviceResponse = ServiceResponse.success(
        "Login successfully",
        userResponse,
        StatusCodes.OK,
    );

    res.status(serviceResponse.statusCode)
        .cookie(COOKIE_NAME, sessionCreated.id, {
            domain: env.HOST,
            path: "/",
            maxAge: SESSION_MAX_AGE,
            secure: env.isProduction ? true : false,
            httpOnly: true,
            sameSite: "lax",
            signed: true,
        })
        .send(serviceResponse);
});

export const sendVerificationLink = asyncHandler(
    async (req: Request, res: Response) => {
        const originPathname = req.get("x-current-pathname") || "/";
        const userId = req.userId;

        if (!userId) {
            throw ApiError.notFound("Missing user ID");
        }

        await AuthService.sendVerificationLink(userId, originPathname);

        const serviceResponse = ServiceResponse.success(
            "Send verification link successfully",
            null,
        );

        return res.status(serviceResponse.statusCode).send(serviceResponse);
    },
);

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token, redirectTo } = verifyQuerySchema.parse(req.query);

    const isVerify = await AuthService.verifyEmail(token);

    const redirectUrl = `${env.CORS_ORIGIN}${redirectTo}?isVerify=${isVerify}`;

    return res.redirect(redirectUrl);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.signedCookies[COOKIE_NAME] as string;

    await db.delete(sessions).where(eq(sessions.id, sessionId));

    const serviceResponse = ServiceResponse.success(
        "Logout successfully",
        null,
        StatusCodes.OK,
    );

    return res
        .status(serviceResponse.statusCode)
        .clearCookie(COOKIE_NAME, {
            domain: env.HOST,
            path: "/",
            secure: env.isProduction ? true : false,
            sameSite: "lax",
            httpOnly: true,
        })
        .send(serviceResponse);
});
