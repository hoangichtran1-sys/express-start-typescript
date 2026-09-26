import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { addHours, isAfter } from "date-fns";
import { db } from "@/configs/db";
import { asyncHandler } from "@/utils/async-handler";
import { ApiError } from "@/utils/api-error";
import { sessions, users } from "@/db/schema";
import { COOKIE_NAME, SESSION_MAX_AGE } from "@/constants";
import type { UserParams } from "@/api/users/users.schema";
import { env } from "@/configs/env";

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export const isAuthenticated = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const sessionId = req.signedCookies[COOKIE_NAME] as string;

        if (!sessionId) {
            throw ApiError.unauthorized("Session not found");
        }

        const [session] = await db
            .select()
            .from(sessions)
            .where(eq(sessions.id, sessionId));

        if (!session) {
            throw ApiError.unauthorized("Failed to get session");
        }

        if (isAfter(new Date(), session.expiresAt)) {
            if (!session.remember) {
                await db.delete(sessions).where(eq(sessions.id, session.id));

                res.clearCookie(COOKIE_NAME, {
                    domain: env.HOST,
                    path: "/",
                    secure: env.isProduction ? true : false,
                    sameSite: "lax",
                    httpOnly: true,
                });

                throw ApiError.unauthorized("Session expires at");
            } else {
                const newSession = await db.transaction(async (tx) => {
                    const userId = session.userId;

                    await tx
                        .delete(sessions)
                        .where(eq(sessions.id, session.id));

                    const [sessionCreated] = await tx
                        .insert(sessions)
                        .values({
                            userId,
                            expiresAt: addHours(new Date(), 10),
                            remember: true,
                        })
                        .returning();

                    if (!sessionCreated) {
                        throw ApiError.notFound("Failed to create session");
                    }

                    return sessionCreated;
                });

                res.cookie(COOKIE_NAME, newSession.id, {
                    domain: env.HOST,
                    path: "/",
                    maxAge: SESSION_MAX_AGE,
                    secure: env.isProduction ? true : false,
                    httpOnly: true,
                    sameSite: "lax",
                    signed: true,
                });
            }
        }

        req.userId = session.userId;

        return next();
    },
);

export const isAdmin = asyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
        const userId = req.userId;

        if (!userId) {
            throw ApiError.badRequest("Missing user ID");
        }

        const [userWithRole] = await db
            .select({ role: users.role })
            .from(users);

        if (!userWithRole) {
            throw ApiError.notFound("User not found");
        }

        if (userWithRole.role !== "admin") {
            throw ApiError.forbidden("User not role admin");
        }

        return next();
    },
);

export const isOwner = asyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
        const { id } = req.params as UserParams;
        const currentId = req.userId;

        if (!currentId) {
            throw ApiError.badRequest("Missing user ID");
        }

        if (id !== currentId) {
            throw ApiError.forbidden("Forbiddent");
        }

        return next();
    },
);
