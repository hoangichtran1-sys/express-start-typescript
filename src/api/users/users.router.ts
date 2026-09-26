import express, { type Router } from "express";
import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
    destroy,
    getAll,
    getCurrent,
    getByID,
    updateName,
    updatePassword,
} from "./users.controller";
import { isAuthenticated, isOwner } from "@/middleware/auth";
import { createApiResponse } from "@/api-docs/open-api-response-builders";
import { userDTO } from "@/db/schema";
import {
    userParamsSchema,
    userUpdateNameSchema,
    userUpdatePasswordSchema,
} from "./users.schema";

export const usersRegistry = new OpenAPIRegistry();
export const usersRouter: Router = express.Router();

usersRegistry.registerPath({
    method: "get",
    path: "/api/users",
    tags: ["User"],
    responses: createApiResponse(z.array(userDTO), "Get all users"),
});

usersRouter.get("/", isAuthenticated, getAll);

usersRegistry.registerPath({
    method: "get",
    path: "/api/users/current",
    tags: ["User"],
    responses: createApiResponse(userDTO, "Get current user"),
});

usersRouter.get("/current", isAuthenticated, getCurrent);

usersRegistry.registerPath({
    method: "get",
    path: "/api/users/{id}",
    tags: ["User"],
    request: { params: userParamsSchema },
    responses: createApiResponse(userDTO, "Get user by id"),
});

usersRouter.get("/:id", isAuthenticated, getByID);

usersRegistry.registerPath({
    method: "patch",
    path: "/api/users/{id}/name",
    tags: ["User"],
    request: {
        params: userParamsSchema,
        body: {
            content: {
                "application/json": {
                    schema: userUpdateNameSchema,
                },
            },
        },
    },
    responses: createApiResponse(userDTO, "Update user name"),
});

usersRouter.patch("/:id/name", isAuthenticated, isOwner, updateName);

usersRegistry.registerPath({
    method: "patch",
    path: "/api/users/{id}/password",
    tags: ["User"],
    request: {
        params: userParamsSchema,
        body: {
            content: {
                "application/json": {
                    schema: userUpdatePasswordSchema,
                },
            },
        },
    },
    responses: createApiResponse(userDTO, "Update user password"),
});

usersRouter.patch("/:id/password", isAuthenticated, isOwner, updatePassword);

usersRegistry.registerPath({
    method: "delete",
    path: "/api/users/{id}",
    tags: ["User"],
    request: { params: userParamsSchema },
    responses: createApiResponse(userDTO, "Delete user"),
});

usersRouter.delete("/:id", isAuthenticated, isOwner, destroy);
