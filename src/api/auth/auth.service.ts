import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import argon2 from "argon2";
import { addHours, addMinutes, isAfter } from "date-fns";
import { db } from "@/configs/db";
import type { RegisterRequest, LoginRequest } from "./auth.schema";
import { sessions, users, verification } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import { env } from "@/configs/env";
import { sendEmail } from "@/utils/send-mail";

export class AuthService {
    static async sendVerificationLink(userId: string, pathname: string) {
        const [user] = await db
            .select({
                email: users.email,
                id: users.id,
                emailVerifiedAt: users.emailVerifiedAt,
            })
            .from(users)
            .where(eq(users.id, userId));

        if (!user) {
            throw ApiError.notFound("User not found");
        }

        if (!!user.emailVerifiedAt) {
            throw ApiError.badRequest("Email verified");
        }

        const token = crypto.randomBytes(32).toString("hex");
        await db.insert(verification).values({
            identifier: user.id,
            value: token,
            expiresAt: addMinutes(new Date(), 15),
        });

        const verificationUrl = `${env.APP_URL}/api/auth/verify-email?token=${token}&redirectTo=${pathname}`;

        const html = `Please click the following link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a>`;

        await sendEmail({
            email: user.email,
            subject: "Verify Your Email",
            html,
        });
    }

    static async verifyEmail(token: string) {
        const [verificationData] = await db
            .select()
            .from(verification)
            .where(eq(verification.value, token));

        if (!verificationData) {
            return false;
            // throw ApiError.badRequest("Token invalid");
        }

        if (isAfter(new Date(), verificationData.expiresAt)) {
            return false;
            //throw ApiError.badRequest("Token expired");
        }

        const [userVerified] = await db
            .update(users)
            .set({
                emailVerifiedAt: new Date(),
            })
            .where(eq(users.id, verificationData.identifier))
            .returning();

        if (!userVerified) {
            return false;
            //throw ApiError.badRequest("Failed to verified user");
        }

        const dataClear = await db
            .select()
            .from(verification)
            .where(eq(verification.identifier, userVerified.id));

        await Promise.all(
            dataClear.map((item) =>
                db.delete(verification).where(eq(verification.id, item.id)),
            ),
        );

        return true;
    }

    static async register(body: RegisterRequest) {
        const { name, email, password } = body;

        return await db.transaction(async (tx) => {
            const [existingUser] = await tx
                .select()
                .from(users)
                .where(eq(users.email, email));

            if (existingUser) {
                throw ApiError.conflict("User already exists");
            }

            const hashPassword = await argon2.hash(password);

            const [userCreated] = await tx
                .insert(users)
                .values({
                    name,
                    email,
                    password: hashPassword,
                    role: email === env.EMAIL_ADMIN ? "admin" : "user",
                })
                .returning();

            if (!userCreated) {
                throw ApiError.badRequest("Failed to register user");
            }

            const [sessionCreated] = await tx
                .insert(sessions)
                .values({
                    userId: userCreated.id,
                    expiresAt: addHours(new Date(), 10),
                })
                .returning();

            if (!sessionCreated) {
                throw ApiError.notFound("Failed to create session");
            }

            return { userCreated, sessionCreated };
        });
    }

    static async login(body: LoginRequest) {
        const { email, password, remember } = body;

        return await db.transaction(async (tx) => {
            const [existingUser] = await tx
                .select()
                .from(users)
                .where(eq(users.email, email));

            if (!existingUser || !existingUser.password) {
                throw ApiError.notFound("User not found");
            }

            const isVerifyPassword = await argon2.verify(
                existingUser.password,
                password,
            );

            if (!isVerifyPassword) {
                throw ApiError.unauthorized("Invalid credentials");
            }

            const [sessionCreated] = await tx
                .insert(sessions)
                .values({
                    userId: existingUser.id,
                    expiresAt: addHours(new Date(), 10),
                    remember: !!remember,
                })
                .returning();

            if (!sessionCreated) {
                throw ApiError.notFound("Failed to create session");
            }

            return { existingUser, sessionCreated };
        });
    }
}
