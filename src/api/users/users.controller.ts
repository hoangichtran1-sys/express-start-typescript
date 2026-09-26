import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { UserService } from "./users.service";
import { ServiceResponse } from "@/utils/service-response";
import {
    userUpdateNameSchema,
    userUpdatePasswordSchema,
    type UserParams,
} from "./users.schema";

export const getCurrent = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const userId = req.userId;
        const user = await UserService.getCurrent(userId);

        const serviceResponse = ServiceResponse.success(
            "Get current user",
            user,
        );

        return res.status(serviceResponse.statusCode).send(serviceResponse);
    },
);

export const getByID = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const { id } = req.params as UserParams;
        const user = await UserService.getByID(id);

        const serviceResponse = ServiceResponse.success("Get user by ID", user);

        return res.status(serviceResponse.statusCode).send(serviceResponse);
    },
);

export const getAll = asyncHandler(
    async (_req: Request, res: Response, _next: NextFunction) => {
        const users = await UserService.getAll();

        const serviceResponse = ServiceResponse.success("Get all users", users);

        return res.status(serviceResponse.statusCode).send(serviceResponse);
    },
);

export const updateName = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const { id } = req.params as UserParams;
        const body = userUpdateNameSchema.parse({ ...req.body });
        const userUpdated = await UserService.updateName(id, body);

        const serviceResponse = ServiceResponse.success(
            "Updated user name",
            userUpdated,
        );

        return res.status(serviceResponse.statusCode).send(serviceResponse);
    },
);

export const updatePassword = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const { id } = req.params as UserParams;
        const body = userUpdatePasswordSchema.parse({ ...req.body });
        const userUpdated = await UserService.updatePassword(id, body);

        const serviceResponse = ServiceResponse.success(
            "Updated user password",
            userUpdated,
        );

        return res.status(serviceResponse.statusCode).send(serviceResponse);
    },
);

export const destroy = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction) => {
        const { id } = req.params as UserParams;
        const userDelelted = await UserService.remove(id);

        const serviceResponse = ServiceResponse.success(
            "Deleted user",
            userDelelted,
        );

        return res.status(serviceResponse.statusCode).send(serviceResponse);
    },
);
