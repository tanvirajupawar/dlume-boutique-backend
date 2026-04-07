const UserController = require("../controllers/user_controller");
const { isAuthenticated } = require("../middlewares/auth");

const userRouter = require("express").Router();

// Public routes
userRouter.post("/user/createAccount", UserController.createAccount);
userRouter.post("/user/signIn", UserController.signIn);

// 🔐 Protected route
userRouter.post(
  "/user/save-fcm-token",
  isAuthenticated,
  UserController.fcmToken
);

module.exports = userRouter;