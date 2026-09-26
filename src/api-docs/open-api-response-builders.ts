import { StatusCodes } from "http-status-codes";
import type { z } from "zod";

import { ServiceResponseSchema } from "@/utils/service-response";

export function createApiResponse(
    schema: z.ZodType,
    description: string,
    statusCode = StatusCodes.OK,
) {
    return {
        [statusCode]: {
            description,
            content: {
                "application/json": {
                    schema: ServiceResponseSchema(schema),
                },
            },
        },
    };
}
