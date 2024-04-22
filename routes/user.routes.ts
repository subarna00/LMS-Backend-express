import { authorizedRole, isAuthenticated } from "../middleware/auth";
import { activationUser, loginUser, logoutUser, registerUser } from "../controller/user.controller";
import express from "express"
const userRouter = express.Router();

userRouter.post("/register", registerUser)
userRouter.post("/activate-user", activationUser)
userRouter.post("/login", loginUser)
userRouter.get("/logout",isAuthenticated,authorizedRole("admin"), logoutUser)

export default userRouter;