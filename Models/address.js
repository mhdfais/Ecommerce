const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  addressDetails: [
    {
      address: {
        type: String,
      },
      pincode: {
        type: String,
      },
      state: {
        type: String,
      },
      city: {
        type: String,
      },
      country: {
        type: String,
      },
      isDefault: {
        type: Boolean,
        default: false,
      },
    },
  ],
});

module.exports = mongoose.model("Address", addressSchema);
