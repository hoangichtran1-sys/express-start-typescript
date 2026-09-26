import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/utils/service-response";

export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (
        req.originalUrl.startsWith("/docs") ||
        req.originalUrl.startsWith("/swagger.json")
    ) {
        return next();
    }

    const serviceResponse = ServiceResponse.failure(
        `Route ${req.method} ${req.originalUrl} not found`,
        null,
        StatusCodes.NOT_FOUND,
    );
    return res.status(serviceResponse.statusCode).send(serviceResponse);
};
