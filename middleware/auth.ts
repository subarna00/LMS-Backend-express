import { NextFunction, Request, Response } from "express";
import { CatchAsyncErrorMiddleware } from "./catchAsyncErrors";
import ErrorHandler from "../utils/errorHandelers";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "process";
import { redis } from "../utils/redis";
import { IUser } from "../models/user.model";

declare global {
    namespace Express {
        interface Request {
            user?: IUser
        }
    }
}

export const isAuthenticated = CatchAsyncErrorMiddleware(async (req: Request,res: Response, next: NextFunction)=>{
    const access_token = req.cookies.access_token;

    if (!access_token) {
        return next(new ErrorHandler("User is not authenticated",401));
    }
    const decoded = jwt.verify(access_token,env.ACCESS_TOKEN as string) as JwtPayload;
    if (!decoded) {
        return next(new ErrorHandler("Access token is not valid",401));
    }
    const user = await redis.get(decoded.id);

    if (!user) {
        return next(new ErrorHandler("user not found",401));
    }

    req.user = JSON.parse(user);

    next();
})

export const authorizedRole =(...roles: string[])=>{
    return async (req: Request,res: Response, next: NextFunction)=>{
        if (!roles.includes(req.user?.role || '')) {
            return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resources.`,401))
        }
        next();
    }
}