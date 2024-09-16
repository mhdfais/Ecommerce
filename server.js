const express = require("express");
const app = express();
require("dotenv").config();

const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/ecommerce");

app.use(express.static("public"));

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
