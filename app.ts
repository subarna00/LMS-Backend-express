import express, { NextFunction, Request, Response } from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import { ErrorHandlerMiddleware } from "./middleware/error";
import userRouter from "./routes/user.routes";
export const app = express();

// body parser
app.use(express.json({limit: "50mb"}));
// cookie parser
app.use(cookieParser());

// cross origin resources sharing
app.use(cors({
    origin: process.env.ORIGIN
}));

// routes
app.use("/api/v1",userRouter);


// unknown route
app.all("*", (req:Request,res: Response, next: NextFunction)=>{
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    next(err);
})

app.use(ErrorHandlerMiddleware);