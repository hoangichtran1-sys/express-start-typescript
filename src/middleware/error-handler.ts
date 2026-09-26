import { z, ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import type { Response, Request, NextFunction } from "express";
import { logger } from "@/server";
import { ServiceResponse } from "@/utils/service-response";
import { ApiError } from "@/utils/api-error";

const formatZodError = (res: Response, error: z.ZodError) => {
    const errors = error?.issues?.map((err) => ({
        field: err.path.join("."),
        message: err.message,
    }));
    const serviceResponse = ServiceResponse.failure(
        "Validation failed",
        errors,
        StatusCodes.BAD_REQUEST,
    );
    return res.status(serviceResponse.statusCode).send(serviceResponse);
};

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction,
) => {
    logger.error(err, `Request failed at path: ${req.path}`);

    if (err instanceof ZodError) {
        return formatZodError(res, err);
    }

    if (err instanceof ApiError) {
        const serviceResponse = ServiceResponse.failure(
            err.message,
            null,
            err.statusCode,
        );
        return res.status(serviceResponse.statusCode).send(serviceResponse);
    }

    return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(
            ServiceResponse.failure(
                "Something went wrong",
                null,
                StatusCodes.INTERNAL_SERVER_ERROR,
            ),
        );
};
