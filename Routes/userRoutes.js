const express = require("express");
const user_route = express();

const userController = require("../Controller/userController");

const isUser = require("../Middlewares/userAuth");
const checkBlocked = require("../Middlewares/isBlocked");

user_route.set("view engine", "ejs");
user_route.set("views", "./Views/User");

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

user_route.use(express.static("public"));

const session = require("express-session");

user_route.use(
  session({
    secret: "something_key",
    resave: false,
    saveUninitialized: false,
  })
);

user_route.get("/register", userController.loadRegister);
user_route.get("/login", userController.loadLogin);
user_route.get("/otp-verification", userController.loadOtpVerification);
user_route.post("/register", userController.insertUser);
user_route.post("/verify-otp", userController.verifyOtp);
user_route.post("/verifyLogin", userController.verifyLogin);
user_route.get("/resendOtp", userController.resendOtp);

user_route.get(
  "/forgot-password",
  userController.loadForgotPasswordEmailVerification
);
user_route.get("/reset-password/:token", userController.loadResetPassword);
user_route.post("/forgot-password", userController.verifyForgotPasswordEmail);
user_route.post("/reset-password", isUser, userController.resetPassword);

user_route.get("/home", isUser, userController.loadHome);

user_route.get(
  "/product-details/:id",
  isUser,
  userController.loadProductDetails
);

user_route.get("/profile", isUser, userController.loadProfile);
user_route.post("/edit-profile/:id", userController.verifyEditProfile);
user_route.post("/profile-changePswd/:id", userController.verifyChangePassword);

user_route.get("/address", isUser, userController.loadAddress);
user_route.get("/add-address", isUser, userController.loadAddAddress);
user_route.post("/add-address", userController.verifyAddAddress);
user_route.get("/edit-address/:id", isUser, userController.loadEditAddress);
user_route.post("/edit-address", userController.verifyEditAddress);
user_route.delete("/delete-address/:addressId", userController.deleteAddress);

user_route.get("/cart", userController.loadCart);

user_route.get("/logout", userController.logout);

module.exports = user_route;
