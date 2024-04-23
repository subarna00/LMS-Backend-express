require("dotenv").config();

import { Response } from "express";
import { IUser } from "models/user.model";
import { env } from "process";
import { redis } from "./redis";

interface TokenOption {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | undefined;
  secure?: boolean;
}

// parse env vaiable to integrate with fallback values
export const accessTokenExpires = parseInt(
  env.ACCESS_TOKEN_EXPIRES || "300",
  10
);

export const refreshTokenExpires = parseInt(
  env.REFRESH_TOKEN_EXPIRES || "300",
  10
);

// options for cookies
export const accessTokenOptions: TokenOption = {
  expires: new Date(Date.now() + accessTokenExpires * 60 * 60 * 1000),
  maxAge: accessTokenExpires * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
  secure: false,
};

export const refreshTokenOptions: TokenOption = {
  expires: new Date(Date.now() + refreshTokenExpires * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpires * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
  secure: false,
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignInAccessToken();
  const refreshToken = user.SignInRefreshToken();

  // upload session to redis
  redis.set(user._id, JSON.stringify(user) as string);

  if (env.NODE_ENV == "production") {
    accessTokenOptions.secure = true;
  }

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    user,
    access_token: accessToken,
  });

};
