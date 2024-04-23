import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { CatchAsyncErrorMiddleware } from "../middleware/catchAsyncErrors";
import { IUser, userModel } from "../models/user.model";
import ErrorHandler from "../utils/errorHandelers";

import { sendMail } from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { env } from "process";
require("dotenv").config();
interface IRegisterBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registerUser = CatchAsyncErrorMiddleware(async(req: Request,res: Response,next: NextFunction)=>{
    try {
        const {name,email,password} = req.body;
        const emailExist = await userModel.findOne({email});
        if(emailExist){
            return next(new ErrorHandler("Email already exist",400));
        }
        const user: IRegisterBody = {
            name,
            email,
            password
        }
        const activationToken = createActivationToken(user);

        const data = {user:{name:user.name},activationCode: activationToken.activationCode};

        try {
                await sendMail({
                    email: user.email,
                    subject:"Registration Mail",
                    template:"activation-mail.ejs",
                    data
                })
                res.status(201).json({
                    success: true,
                    activationCode: activationToken.activationCode,
                    activationToken: activationToken.token,
                    message:"Please check you mail. Verification code has been sent to your account."
                })
        } catch (error: any) {
             return next(new ErrorHandler(error.message, 400));
        }
    } catch (error: any) {
        return next(new ErrorHandler(error.message,400))
    }
})

interface IActivationToken{
    token: string;
    activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken =>{
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = jwt.sign({user,activationCode},process.env.JWT_SECRET_KEY as Secret,{
        expiresIn: "5m"
    });
    return {
        token,activationCode
    }
}

interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}

export const activationUser = CatchAsyncErrorMiddleware(async(req:Request,res:Response,next: NextFunction)=>{
    try {
        const {activation_token, activation_code} = req.body as IActivationRequest
        const newUser: { user: IUser; activationCode: string } = jwt.verify(
          activation_token,
          process.env.JWT_SECRET_KEY as string
        ) as { user: IUser; activationCode: string};

        if(newUser.activationCode !== activation_code){
            return next(new ErrorHandler("Invalid code passed.", 400));
        }
        const {name,email,password} = newUser.user;
        const emailExists = await userModel.findOne({email});
        if(emailExists){
            return next(new ErrorHandler("Email already exists.", 400));
        }
        const user = userModel.create({
            name,email,password
        })
        res.status(201).json({success: true,message:"User is created."})

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

interface ILoginRequest {
    email: string;
    password: string;
}

export const loginUser = CatchAsyncErrorMiddleware(async (req:Request,res: Response,next: NextFunction)=>{
    try {
        const {email,password}: ILoginRequest = req.body;
        if(!email || !password){
            return next(new ErrorHandler("Please enter email and password.", 400));
        }
        const user = await userModel.findOne({email}).select("+password");
        if (!user) {
            return next(new ErrorHandler("Invalid email and password.", 400));
        }
        const isPasswordMatch = user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new ErrorHandler("Invalid email and password.", 400));
        }
        sendToken(user,200,res);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

export const logoutUser = CatchAsyncErrorMiddleware(async (req: Request,res: Response , next: NextFunction)=>{
    try {
        res.cookie("access_token","",{maxAge:1});
        res.cookie("refresh_token","",{maxAge:1});
        redis.del(req?.user?._id);
        res.status(200).json({
            success: true,
            message:"Logged out successfully."
        })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

export const updateAccessToken = CatchAsyncErrorMiddleware(async (req: Request,res: Response , next: NextFunction)=>{
        try {
            const refresh_token = req.cookies.refresh_token as string;

            const decoded = jwt.verify(refresh_token,env.REFRESH_TOKEN as string) as JwtPayload;
            if (!decoded) {
                return next(new ErrorHandler("Could not refresh token.", 400));
            }

            const session = await redis.get(decoded.id as string);
            if (!session) {
                return next(new ErrorHandler("Could not refresh token.", 400));
            }

            const user = JSON.parse(session);
            const access_token = jwt.sign({id: user._id},env.ACCESS_TOKEN as string,{
                expiresIn:"5m"
            })

            res.cookie("access_token", access_token, accessTokenOptions);
            res.cookie("refresh_token", refresh_token, refreshTokenOptions);

            res.status(200).json({
                success: true,
                access_token
            })

        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
})