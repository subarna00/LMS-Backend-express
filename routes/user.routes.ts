import { activationUser, registerUser } from "../controller/user.controller";
import express from "express"
const userRouter = express.Router();

userRouter.post("/register", registerUser)
userRouter.post("/activate-user", activationUser)

export default userRouter;