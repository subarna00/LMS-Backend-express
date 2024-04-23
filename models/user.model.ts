require("dotenv").config();
import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  isVerified: boolean;
  comparePassword: (password: string) => Promise<boolean>;
  courses: Array<{ courseId: string }>;
  avatar: {
    public_id: string;
    url: string;
  };
  SignInAccessToken: ()=> string;
  SignInRefreshToken: ()=> string;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name."],
    },
    email: {
      type: String,
      required: [true, "Please enter your email."],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "Please enter valid email.",
      },
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minlength: [6, "Password must be at least 8 characters"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        course_id: String,
      },
    ],
  },
  { timestamps: true }
);

// hash password on save
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
// compare password
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// sign in access token
userSchema.methods.SignInAccessToken = function (){
  return jwt.sign({id: this._id},process.env.ACCESS_TOKEN || '',{expiresIn:"5m"})
}
// sign in refresh token
userSchema.methods.SignInRefreshToken = function (){
  return jwt.sign({id: this._id},process.env.REFRESH_TOKEN || '',{expiresIn:"3d"})
}

export const userModel: Model<IUser> = mongoose.model("user",userSchema);