const mongoose = require("mongoose");

const googleAuthUserSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  displayName: String,
});

module.exports = ("user", googleAuthUserSchema);
