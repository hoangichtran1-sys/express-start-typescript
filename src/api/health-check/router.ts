import express, { type Request, type Response, type Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { ServiceResponse } from "@/utils/service-response";
import { createApiResponse } from "@/api-docs/open-api-response-builders";

export const healthCheckRegistry = new OpenAPIRegistry();
export const healthCheckRouter: Router = express.Router();

healthCheckRegistry.registerPath({
    method: "get",
    path: "/api/health-check",
    tags: ["Health Check"],
    responses: createApiResponse(z.object(), "Success"),
});

healthCheckRouter.get("/", (_req: Request, res: Response) => {
    const serviceResponse = ServiceResponse.success("Service is healthy", {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
    res.status(serviceResponse.statusCode).send(serviceResponse);
});

healthCheckRegistry.registerPath({
    method: "get",
    path: "/api/health-check/details",
    tags: ["Health Check"],
    responses: createApiResponse(z.object(), "Success"),
});

healthCheckRouter.get("/details", (_req: Request, res: Response) => {
    const healthData = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        version: process.env.npm_package_version || "1.0.0",
        memory: {
            used:
                Math.round(
                    (process.memoryUsage().heapUsed / 1024 / 1024) * 100,
                ) / 100,
            total:
                Math.round(
                    (process.memoryUsage().heapTotal / 1024 / 1024) * 100,
                ) / 100,
            unit: "MB",
        },
        cpu: {
            usage: process.cpuUsage(),
        },
    };
    const serviceResponse = ServiceResponse.success(
        "Service is healthy",
        healthData,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
});
