const express = require("express");
const userCntrl = require("../controllers/user");
const auth = require("../middleware/auth");

const userRouter = express();

userRouter.post("/register", auth.registerValidator, userCntrl.userRegister);
userRouter.post("/login", auth.loginValidator, userCntrl.userLogin);
userRouter.post("/forgotPassowrd", userCntrl.forgotPassowrd);
userRouter.post("/verifyOtp", auth.otpValidator, userCntrl.verifyOtp);

module.exports = userRouter;
