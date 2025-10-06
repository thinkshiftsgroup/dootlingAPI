import { Request, Response, NextFunction } from "express";
import logger from "@utils/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Error: ${err.message}`, err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : {},
  });
};
