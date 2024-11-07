const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  price: {
    type: Number,
  },
  stock: {
    type: Number,
    required: true,
  },
  images: {
    type: Array,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  inWishlist: {
    type: Boolean,
    default: false,
  },
  offerPrice: {
    type: Number,
  },
  offerPercentage: {
    type: Number,
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "offer",
    default: null,
  },
  isDiscounted: {
    type: Boolean,
    default: false,
  },
});
productSchema.pre("save", function (next) {
  if (this.offerId) {
     this.offerPrice = Math.floor(this.price - (this.price * this.offerPercentage / 100))
  }else{
    this.offerPrice=0
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
