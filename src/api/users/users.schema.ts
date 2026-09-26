import { z } from "zod";

export const userParamsSchema = z.object({
    id: z.string().min(1),
});

export const userUpdateNameSchema = z.object({
    name: z.string().min(1),
});

export const userUpdatePasswordSchema = z.object({
    oldPassword: z
        .string()
        .min(6, "Password too short")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .nullable(),
    newPassword: z
        .string()
        .min(6, "Password too short")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter"),
});

export type UserParams = z.infer<typeof userParamsSchema>;
export type UserUpdateName = z.infer<typeof userUpdateNameSchema>;
export type UserUpdatePassword = z.infer<typeof userUpdatePasswordSchema>;
