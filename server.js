const express = require("express");
const app = express();
require("dotenv").config();

const mongoose = require("mongoose");
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log("connected to database"))
  .catch((err) => console.log("could not connect to db", err));

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

const nocache = require("nocache");
app.use(nocache());

const flash = require("connect-flash");
app.use(flash());

const userRoute = require("./Routes/userRoutes");
app.use("/", userRoute);

const adminRoute = require("./Routes/adminRoutes");
app.use("/", adminRoute);

const PORT = process.env.PORT || 4444;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
