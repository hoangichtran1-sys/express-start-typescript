import { eq } from "drizzle-orm";
import argon2 from "argon2";
import { db } from "@/configs/db";
import { userDTO, users } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import type { UserUpdateName, UserUpdatePassword } from "./users.schema";

export class UserService {
    static async getCurrent(id?: string) {
        if (!id) {
            throw ApiError.badRequest("Missing user ID");
        }
        const [currentUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, id));

        if (!currentUser) {
            throw ApiError.notFound("User not found");
        }

        return userDTO.parse(currentUser);
    }

    static async getByID(id: string) {
        const [user] = await db.select().from(users).where(eq(users.id, id));

        if (!user) {
            throw ApiError.notFound("User not found");
        }

        return userDTO.parse(user);
    }

    static async getAll() {
        const data = await db.select().from(users);

        return data.map((user) => {
            const userFormat = userDTO.parse(user);

            return userFormat;
        });
    }

    static async updateName(id: string, body: UserUpdateName) {
        const [userUpdated] = await db
            .update(users)
            .set({
                name: body.name,
            })
            .where(eq(users.id, id))
            .returning();

        if (!userUpdated) {
            throw ApiError.notFound("Failed to update user");
        }

        return userDTO.parse(userUpdated);
    }

    static async updatePassword(id: string, body: UserUpdatePassword) {
        const { oldPassword, newPassword } = body;

        const [user] = await db
            .select({ password: users.password })
            .from(users);

        if (!user) {
            throw ApiError.notFound("User not found");
        }

        if (user.password && !oldPassword) {
            throw ApiError.forbidden("Missing old password");
        }

        if (oldPassword && user.password) {
            const isVerifyOldPassword = await argon2.verify(
                user.password,
                oldPassword,
            );

            if (!isVerifyOldPassword) {
                throw ApiError.unauthorized("Invalid credentials");
            }
        }

        const hashNewPassword = await argon2.hash(newPassword);

        const [userUpdated] = await db
            .update(users)
            .set({
                password: hashNewPassword,
            })
            .where(eq(users.id, id))
            .returning();

        if (!userUpdated) {
            throw ApiError.notFound("Failed to update user");
        }

        return userDTO.parse(userUpdated);
    }

    static async remove(id: string) {
        const [userDeleted] = await db
            .delete(users)
            .where(eq(users.id, id))
            .returning();

        if (!userDeleted) {
            throw ApiError.notFound("Failed to delete user");
        }

        return userDTO.parse(userDeleted);
    }
}
