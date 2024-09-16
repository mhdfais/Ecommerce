const mongoose = require("mongoose");
const { type } = require("os");
const { boolean } = require("webidl-conversions");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phno: {
    type: String,
    required: true,
  },
  pswd: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("User", userSchema);
