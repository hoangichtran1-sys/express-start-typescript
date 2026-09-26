import express, { type Request, type Response, type Router } from "express";
import swaggerUi from "swagger-ui-express";

import { generateOpenAPIDocument } from "@/api-docs/open-api-document-generator";

const openAPIDocument = generateOpenAPIDocument();
export const openAPIRouter: Router = express.Router();

openAPIRouter.get("/swagger.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(openAPIDocument);
});

openAPIRouter.use("/docs", swaggerUi.serve, swaggerUi.setup(openAPIDocument));
