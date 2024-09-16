const express = require("express");
const admin_route = express();

admin_route.set("view engine", "ejs");
admin_route.set("views", "./Views/Admin");

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));

const session = require("express-session");
admin_route.use(
  session({
    secret: "admin_security_key",
    resave: false,
    saveUninitialized: true,
  })
);

const adminController = require("../Controller/adminController");

admin_route.get("/adminLogin", adminController.loadAdminLogin);
admin_route.get("/adminHome", adminController.loadAdminHome);
admin_route.post("/verifyAdmin", adminController.verifyAdminLogin);

module.exports = admin_route;
