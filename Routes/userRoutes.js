const express = require("express");
const user_route = express();

const userController = require("../Controller/userController");

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
    saveUninitialized: true,
  })
);

user_route.get("/register", userController.loadRegister);
user_route.get("/login", userController.loadLogin);
user_route.get("/otp-verification", userController.loadOtpVerification);
user_route.get("/home", userController.loadHome);
user_route.post("/register", userController.insertUser);
user_route.post("/verify-otp", userController.verifyOtp);
user_route.post("/verifyLogin", userController.verifyLogin);
user_route.get("/resendOtp", userController.resendOtp);

module.exports = user_route;
