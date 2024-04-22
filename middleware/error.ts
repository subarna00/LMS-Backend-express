import ErrorHandler from "../utils/errorHandelers";
import { NextFunction, Request, Response } from "express";

export const ErrorHandlerMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";
  // mongodb error
  if (err.name == "CastError") {
    const message = `Resource not found. Invalid :${err.path}`;
    err = new ErrorHandler(message, 400);
  }
  // duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }
  // jwt error
  if (err.name == "JsonWebTokenError") {
    const message = `Json web token is invalid, try again`;
    err = new ErrorHandler(message, 400);
  }
  // jwt token expire  error
  if (err.name == "TokenExpireError") {
    const message = `Json web token is expired, try again`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
