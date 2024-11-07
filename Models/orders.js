const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      price: {
        type: Number,
        default: 0,
      },
      quantity: {
        type: Number,
      },
    },
  ],
  totalPrice: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Pending", "Shipped", "Delivered", "Cancelled", "Returned"],
    default: "Pending",
  },
  billingDetails: {
    name: String,
    email: String,
    phno: String,
    address: String,
    pincode: String,
    country: String,
    state: String,
    city: String,
  },
  paymentMethod: {
    type: String,
    default: "COD",
  },
  paymentStatus: {
    type: String,
  },
  orderDate: {
    type: Date,
    default: Date.now(),
  },
  returnReason: {
    type: String,
  },
  discount: {
    type: Number,
    default: 0,
  },
  orderNumber: {
    type: String,
    unique: true,
  },
});

module.exports = mongoose.model("Order", orderSchema);
