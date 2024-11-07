const express = require("express");
const session=require('express-session')
const app = express();
require("dotenv").config();



const mongoose = require("mongoose");
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("connected to database"))
  .catch((err) => console.log("could not connect to db", err));

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "something_key",
    resave: false,
    saveUninitialized: false,
  })
);

const passport = require("passport");
app.use(passport.initialize())
app.use(passport.session())

const nocache = require("nocache");
app.use(nocache());

const flash = require("connect-flash");
app.use(flash());

const userRoute = require("./Routes/userRoutes");
app.use("/", userRoute);

const adminRoute = require("./Routes/adminRoutes");
app.use("/", adminRoute);



const PORT = process.env.PORT;
// console.log(PORT)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
