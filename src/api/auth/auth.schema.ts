import { z } from "zod";
import { userSelectSchema } from "@/db/schema";

export const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Please enter a valid email address"),
    password: z
        .string()
        .min(6, "Password too short")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter"),
});

export const loginSchema = z.object({
    email: z.email("Please enter a valid email address"),
    password: z
        .string()
        .min(6, "Password too short")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter"),
    remember: z.boolean().optional(),
});

export const verifyQuerySchema = z.object({
    token: z.string().min(20),
    redirectTo: z.string().min(1),
});

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
