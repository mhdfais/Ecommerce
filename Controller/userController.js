const User = require("../Models/userModel");
const userOtpVerification = require("../Models/userOtpVerification");
const Product = require("../Models/product");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const easyinvoice = require("easyinvoice");
const { v4: uuidv4 } = require("uuid");
const product = require("../Models/product");
const Address = require("../Models/address");
const Cart = require("../Models/cart");
const Order = require("../Models/orders");
const Wishlist = require("../Models/wishlist");
const Coupon = require("../Models/coupon");
const Wallet = require("../Models/wallet");
const Transaction = require("../Models/transaction");
const Category = require("../Models/category");

// ------------------------------------------------  NODEMAILER  -----------------------------------------------

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "teapoy11@gmail.com",
    pass: "aepy uwml fllg mcly",
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log(success);
  }
});

const googleAuth = (req, res) => {
  if (req.user) {
    const useremail = req.user.email;

    // console.log(useremail);

    req.session.user = { email: req.user.email, _id: req.user._id };
    // console.log("User session created:", req.session.user);
    return res.redirect("/home");
  } else {
    return res.redirect("/login");
  }
};

// ---------------------------------------  RAZORPAY  -------------------------------------------------------

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const verifyPaymentAndCreateOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      addressID,
      paymentMethod,
      discount,
      totalPrice,
      paymentStatus,
    } = req.body;

    const userId = req.session.user._id;

    if (paymentStatus === "Failed") {
      const cart = await Cart.findOne({ userId }).populate("items.product");
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Your cart is empty." });
      }

      const address = await Address.findOne({
        "addressDetails._id": addressID,
      });
      if (!address) {
        return res.status(400).json({ message: "Invalid address." });
      }

      const selectedAddress = address.addressDetails.find(
        (addr) => addr._id.toString() === addressID
      );
      const user = await User.findById(userId);

      const failedOrder = new Order({
        userId: userId,
        items: cart.items.map((item) => ({
          product: item.product._id,
          price: item.price,
          quantity: item.quantity,
        })),
        totalPrice: cart.totalPrice,
        billingDetails: {
          name: user.name,
          email: user.email,
          phno: user.phno,
          address: selectedAddress.address,
          pincode: selectedAddress.pincode,
          country: selectedAddress.country,
          state: selectedAddress.state,
          city: selectedAddress.city,
        },
        discount,
        orderDate: Date.now(),
        paymentMethod: "Razorpay",
        paymentStatus: "Failed",
        orderNumber: uuidv4(),
      });

      await failedOrder.save();
      return res.status(200).json({
        message: "Order created with failed payment status.",
        orderId: failedOrder._id,
      });
    }

    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature." });
    }

    const cart = await Cart.findOne({ userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty." });
    }

    const address = await Address.findOne({ "addressDetails._id": addressID });
    if (!address) {
      return res.status(400).json({ message: "Invalid address." });
    }

    const selectedAddress = address.addressDetails.find(
      (addr) => addr._id.toString() === addressID
    );

    if (!selectedAddress) {
      return res.status(400).json({ message: "Address not found." });
    }

    const user = await User.findById(userId);

    const newOrder = new Order({
      userId: userId,
      items: cart.items.map((item) => ({
        product: item.product._id,
        price: item.price,
        quantity: item.quantity,
      })),
      totalPrice: cart.totalPrice,
      billingDetails: {
        name: user.name,
        email: user.email,
        phno: user.phno,
        address: selectedAddress.address,
        pincode: selectedAddress.pincode,
        country: selectedAddress.country,
        state: selectedAddress.state,
        city: selectedAddress.city,
      },
      discount,
      paymentMethod,
      paymentStatus: "Paid",
      orderNumber: uuidv4(),
    });

    await newOrder.save();

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    await Cart.findOneAndDelete({ userId });

    return res.status(200).json({
      message: "Payment verified and order created successfully!",
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error("Error verifying payment and creating order:", error);
    return res.status(500).json({
      message: "Error verifying payment and creating order.",
    });
  }
};

const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    // console.log(req.body)
    const { addressID, paymentMethod, totalPrice } = req.body;

    // console.log(req.body)
    if (!addressID || !paymentMethod) {
      return res
        .status(400)
        .json({ message: "Missing address or payment method." });
    }

    const cart = await Cart.findOne({ userId }).populate("items.product");
    // console.log(cart)
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty." });
    }

    const address = await Address.findOne({ "addressDetails._id": addressID });
    // console.log(address)
    if (!address) {
      return res.status(400).json({ message: "Invalid address." });
    }

    const selectedAddress = address.addressDetails.find(
      (addr) => addr._id.toString() === addressID
    );

    // console.log(selectedAddress)
    if (!selectedAddress) {
      return res.status(400).json({ message: "Address not found." });
    }

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: cart.totalPrice * 100,
      currency: "INR",
      receipt: "rcpt_" + new Date().getTime(),
      notes: {
        userId: userId.toString(),
      },
    });

    // console.log(razorpayOrder)

    return res.status(200).json({
      message: "Razorpay order created successfully!",
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return res
      .status(500)
      .json({ message: "Server error while creating Razorpay order." });
  }
};

// ============================================  RETRY PAYMENT  ====================================================

const retryPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order || order.paymentStatus !== "Failed") {
      return res
        .status(400)
        .json({ message: "Invalid order or payment not eligible for retry." });
    }

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: order.totalPrice * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: `retry_order_${order._id}`,
    });

    res.json({
      key: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: razorpayOrder.id,
      user: {
        name: order.billingDetails.name,
        email: order.billingDetails.email,
        phno: order.billingDetails.phno,
      },
    });
  } catch (error) {
    console.error("Retry payment creation error:", error);
    res.status(500).json({ message: "Error initiating retry payment." });
  }
};

const verifyRetryPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;
    const userId = req.session.user._id;

    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature." });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: "Paid" },
      { new: true }
    );
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const items = order.items;
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    await Cart.findOneAndDelete({ userId });

    res.json({
      success: true,
      message: "Payment verified and order updated successfully!",
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error verifying payment." });
  }
};

// --------------------------------------------------  OTP  -----------------------------------------------

const loadOtpVerification = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.redirect("/register");
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.redirect("/register");
    }

    const otpRecord = await userOtpVerification.findOne({ userId });
    if (!otpRecord) {
      return res.redirect("/register");
    }

    const invalid = req.flash("invalid");
    res.render("otp-verification", {
      userId,
      expiresAt: otpRecord.expiresAt.getTime(),
      invalid,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const sendOtpVerificationEmail = async ({ _id, email }, res) => {
  // here newUser from insertUser object destructured and extract it to _id and email now
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const mailOptions = {
      from: "teapoy11@gmail.com",
      to: email,
      subject: "Verify your Email",
      html: `<p>Enter <b>${otp}</b> in the app to verify your email address</p>`,
    };
    const hashedOtp = await bcrypt.hash(otp, 10);
    // console.log(`${_id} 22`)/////////////////////////
    const newOtpVerification = new userOtpVerification({
      userId: _id,
      otp: hashedOtp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 300000,
    });

    await newOtpVerification.save();
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error.message);
  }
};

const sendResendOtpVerificationEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "teapoy11@gmail.com",
      pass: "aepy uwml fllg mcly",
    },
  });

  const mailOptions = {
    from: "teapoy11@gmail.com",
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};

const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.redirect(`/otp-verification?userId=${userId}`);
    }

    const userOtpVerificationRecord = await userOtpVerification.findOne({
      userId,
    });

    const { expiresAt, otp: hashedOtp } = userOtpVerificationRecord;
    if (expiresAt < Date.now()) {
      await userOtpVerification.deleteMany({ userId });
      return res.redirect(`/otp-verification?userId=${userId}`);
    }

    const validOtp = await bcrypt.compare(otp, hashedOtp);
    if (!validOtp) {
      req.flash("invalid", "Invalid OTP");
      return res.redirect(`/otp-verification?userId=${userId}`);
    }

    await User.updateOne({ _id: userId }, { isVerified: true });
    await userOtpVerification.deleteMany({ userId });

    res.redirect("/login");
  } catch (error) {
    console.log("Error during OTP verification:", error.message);
    res.redirect(`/otp-verification?userId=${userId}`);
  }
};

const resendOtp = async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect(`/otp-verification?userId=${userId}`);
    }
    if (user.isVerified) {
      return res.redirect("/login");
    }
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    const hashOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await userOtpVerification.updateOne(
      { userId },
      { otp: hashOtp, createdAt: Date.now(), expiresAt: expiresAt },
      { upsert: true }
    );
    await sendResendOtpVerificationEmail(user.email, otp);
    res.redirect(
      `/otp-verification?userId=${userId}&expiresAt=${expiresAt.getTime}`
    );
  } catch (error) {
    console.log(error.message);
  }
};

// ----------------------------------------------------  REGISTER  -------------------------------------------

const loadRegister = async (req, res) => {
  try {
    const pswdMatch = req.flash("pswdMatch");
    const emailExist = req.flash("emailExist");
    // console.log('hiii')
    res.render("register", { emailExist, pswdMatch });
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  const { name, email, phno, pswd, confirmPswd } = req.body;

  if (pswd !== confirmPswd) {
    req.flash("pswdMatch", "Passwords do not match");
    return res.redirect("/register");
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (!existingUser.isVerified) {
        const hashedPswd = await bcrypt.hash(pswd, 10);
        existingUser.name = name;
        existingUser.phno = phno;
        existingUser.pswd = hashedPswd;
        await existingUser.save();

        await userOtpVerification.deleteOne({ userId: existingUser._id });

        await sendOtpVerificationEmail(existingUser, res);

        return res.redirect(`/otp-verification?userId=${existingUser._id}`);
      } else {
        req.flash("emailExist", "User already exists and please login");
        return res.redirect("/register");
      }
    }

    const hashedPswd = await bcrypt.hash(pswd, 10);
    const newUser = new User({
      name,
      email,
      phno,
      pswd: hashedPswd,
    });
    await newUser.save();

    await sendOtpVerificationEmail(newUser, res); // newUser passing as an object represents the mongoDB database, this may contain id, name, email.....
    res.redirect(`/otp-verification?userId=${newUser._id}`);
  } catch (error) {
    console.log(error);
  }
};

// ------------------------------------------------  LOGIN -------------------------------------------------

const verifyLogin = async (req, res) => {
  const { email, pswd } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(pswd, user.pswd))) {
      req.flash("invalidCredential", "Invalid Credential");
      return res.redirect("/login");
    }

    if (!user.isVerified) {
      req.flash("userNotExist", "User does not exist");
      return res.redirect("/login");
    }

    if (user.isBlocked) {
      return res.redirect("/login");
    }

    req.session.user = { email: user.email, _id: user._id };
    // console.log(req.session.user)

    res.redirect("/home");
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    if (!req.session.user) {
      const userNotExist = req.flash("userNotExist");
      const invalidCredential = req.flash("invalidCredential");
      const fail = req.flash("fail");
      const resetPswdMailSent = req.flash("resetPswdMailSent");
      const expired = req.flash("expired");
      res.render("login", {
        invalidCredential,
        userNotExist,
        fail,
        resetPswdMailSent,
        expired,
      });
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// --------------------------------------------------  HOME  -----------------------------------------------

const loadHome = async (req, res) => {
  try {
    const products = await Product.find({ isPublished: true }).populate({
      path: "category",
      match: { isListed: true }, // Only include categories that are listed
      select: "category", // Select the category name (or other fields if needed)
    });

    const filteredProducts = products.filter((product) => product.category); // Filter out products that have no category (due to unlisted categories)

    res.render("home", { products: filteredProducts });
  } catch (error) {
    console.log(error.message);
  }
};

// ----------------------------------------------  PRODUCT DETAILS  ---------------------------------------------

const loadProductDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("brand", "brand")
      .populate("category", "category");

    if (!product) {
      return res.send("product not found");
    }

    res.render("productDetails", { product });
  } catch (error) {
    console.log(error.message);
  }
};

// ------------------------------------------  FORGOT PASSWORD  ------------------------------------------------

const loadForgotPasswordEmailVerification = async (req, res) => {
  try {
    res.render("forgotPasswordEmailVerification");
  } catch (error) {
    console.log(error.message);
  }
};

const loadResetPassword = async (req, res) => {
  try {
    const pswdMatch = req.flash("pswdMatch");
    const samePswd = req.flash("samePswd");
    const { token } = req.params;
    res.render("resetPassword", { pswdMatch, samePswd, token });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyForgotPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const data = await User.findOne({ email });
    if (!data) {
      req.flash("fail", "user not found, Please register");
      return res.redirect("/login");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiration = Date.now() + 3600000;

    data.resetPasswordToken = token;
    data.resetPasswordExpires = tokenExpiration;
    await data.save();

    const resetUrl = `http://localhost:4444/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "teapoy11@gmail.com",
        pass: "aepy uwml fllg mcly",
      },
    });

    const mailOptions = {
      to: data.email,
      from: "teapoy11@gmail.com",
      subject: "Password Reset",
      text: `You are receiving this because you (or someone else) requested the reset of the password for your account.
        Please click on the following link, or paste this into your browser to complete the process:
        ${resetUrl}
        If you did not request this, please ignore this email and your password will remain unchanged.`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(error);
        return res.send("error sending mail");
      } else {
        req.flash("resetPswdMailSent", "Mail has sent ,Please check it");
        res.redirect("/login");
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassword = async (req, res) => {
  const { token, pswd, confirmPswd } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("expired", "link is expired, try again");
      return res.redirect("/login");
    }

    if (pswd != confirmPswd) {
      req.flash("pswdMatch", "Password does not match");
      return res.redirect(`/reset-password/${token}`);
    }

    const isSamePassword = await bcrypt.compare(pswd, user.pswd);
    if (isSamePassword) {
      req.flash("samePswd", "Same as old Password");
      return res.redirect(`/reset-password/${token}`);
    }

    user.pswd = await bcrypt.hash(pswd, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.flash("success", "Reset ");
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};

// -----------------------------------------------  LOGOUT  ------------------------------------------------

const logout = async (req, res) => {
  try {
    req.session.user = null;
    res.redirect("/login");
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------------------  ACCOUNT  -------------------------------------------------------

const loadProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const matchPswd = req.flash("matchPswd");
    const sameOldPswd = req.flash("sameOldPswd");
    res.render("profile", { user, matchPswd, sameOldPswd });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyEditProfile = async (req, res) => {
  const id = req.params.id;
  const { name, phno } = req.body;
  try {
    await User.findByIdAndUpdate(id, {
      name,
      phno,
    });
    res.redirect("/profile");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyChangePassword = async (req, res) => {
  const id = req.params.id;
  const { pswd, newPswd, confirmNewPswd } = req.body;
  try {
    const user = await User.findById(id);
    const isMatch = await bcrypt.compare(pswd, user.pswd);
    if (!isMatch) {
      req.flash("matchPswd", "current password is incorrect");
      return res.redirect("/profile");
    }

    const isSamePassword = await bcrypt.compare(newPswd, user.pswd);
    if (isSamePassword) {
      req.flash(
        "sameOldPswd",
        "New password cannot be the same as the old password"
      );
      return res.redirect("/profile");
    }

    const hashedOtp = await bcrypt.hash(newPswd, 10);
    user.pswd = hashedOtp;
    await user.save();

    return res.redirect("/profile");
  } catch (error) {
    console.log(error);
  }
};

const loadAddress = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const addressData = await Address.findOne({ userId: user._id });

    const addresses = addressData ? addressData.addressDetails : [];

    res.render("address", { addressData: addresses });
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddAddress = async (req, res) => {
  try {
    res.render("addAddress");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyAddAddress = async (req, res) => {
  try {
    const { address, pincode, state, country, city } = req.body;
    const userId = req.session.user._id;

    let userAddress = await Address.findOne({ userId });
    if (!userAddress) {
      userAddress = new Address({
        userId: userId,
        addressDetails: [
          {
            address,
            country,
            state,
            city,
            pincode,
          },
        ],
      });
    } else {
      userAddress.addressDetails.push({
        address,
        country,
        state,
        pincode,
        city,
      });
    }

    await userAddress.save();

    res.redirect("/address");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyEditAddress = async (req, res) => {
  try {
    const { addressId, address, city, state, country, pincode } = req.body;

    await Address.updateOne(
      { "addressDetails._id": addressId },
      {
        $set: {
          "addressDetails.$.address": address,
          "addressDetails.$.city": city,
          "addressDetails.$.state": state,
          "addressDetails.$.country": country,
          "addressDetails.$.pincode": pincode,
        },
      }
    );

    res.redirect("/address");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    // const userId=req.session.user._id
    const address = await Address.findOne({ "addressDetails._id": addressId });
    // console.log(address)
    if (!address) {
      return res.send("Address not found");
    }

    const addressDetail = address.addressDetails.find(
      (detail) => detail._id == addressId //  it searches within the addressDetails array to get the specific address to be edited.
    );

    if (!addressDetail) {
      return res.send("address detail not found");
    }

    res.render("editAddress", { addressDetail });
  } catch (error) {
    console.log(error.message);
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const result = await Address.updateOne(
      { "addressDetails._id": addressId },
      {
        $pull: {
          addressDetails: { _id: addressId },
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error: Unable to delete address" });
  }
};

const loadMyOrders = async (req, res) => {
  try {
    // console.log(req.session.user._id)
    const userId = req.session.user._id;
    // console.log(userId)

    const currentPage = parseInt(req.query.page) || 1;
    const ordersPerPage = 5;
    const totalOrders = await Order.countDocuments({ userId });
    const totalPages = Math.ceil(totalOrders / ordersPerPage);

    const orders = await Order.find({ userId: userId })
      .sort({ orderDate: -1 })
      .skip((currentPage - 1) * ordersPerPage)
      .limit(ordersPerPage);
    res.render("myOrders", { orders, currentPage, totalPages });
  } catch (error) {
    console.log(error.message);
  }
};

const loadOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const orders = await Order.findById(orderId).populate("items.product");
    res.render("orderDetails", { orders });
  } catch (error) {
    console.log(error.message);
  }
};

const orderCancel = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    const wallet = await Wallet.findOne({ userId: order.userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const refundAmount = order.totalPrice;

    if (isNaN(refundAmount)) {
      return res.status(400).json({ message: "Invalid refund amount" });
    }

    wallet.balance += refundAmount;
    await wallet.save();

    order.status = "Cancelled";
    await order.save();

    const transaction = new Transaction({
      userId: order.userId,
      amount: order.totalPrice,
      status: "Success",
      type: "Credited",
    });
    await transaction.save();

    return res.redirect("/home/account/myOrders");
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Error canceling order" });
  }
};

const returnOrder = async (req, res) => {
  const { orderId, reason } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Delivered") {
      return res
        .status(400)
        .json({ message: "Only delivered orders can be returned" });
    }

    if (order.returnStatus === "Pending") {
      return res
        .status(400)
        .json({ message: "Return request already submitted" });
    }

    order.returnReason = reason;
    order.returnStatus = "Pending";
    order.returnRequestDate = new Date();
    await order.save();

    // wallet.balance += refundAmount;
    // await wallet.save();

    // const transaction = new Transaction({
    //   userId: order.userId,
    //   amount: order.totalPrice,
    //   status: "Success",
    //   type: "Credited",
    // });
    // await transaction.save();

    // order.status = "Returned";
    // order.returnReason = reason;

    // await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Return request submitted successfully. Awaiting admin approval.",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const getOrderInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    // console.log(orderId);
    const order = await Order.findById(orderId)
      .populate("userId")
      .populate("items.product");

    // const logoUrl = "/user/logo-11.svg";

    // const invoiceData = {
    //   images: {
    //     logo: "https://public.budgetinvoice.com/img/logo_en_original.png",
    //   },
    //   sender: {
    //     company: "Teapoy Private Limited",
    //   },
    //   client: {
    //     company: order.userId.name,
    //     address: order.billingDetails.address,
    //     zip: order.billingDetails.pincode,
    //     city: order.billingDetails.city,
    //     country: order.billingDetails.country,
    //   },
    //   information: {
    //     number: order.orderNumber,
    //     date: new Date(order.orderDate).toLocaleDateString(),
    //   },
    //   products: order.items.map((item) => ({
    //     description: item.product.title,
    //     quantity: item.quantity,
    //     price: item.price,

    //   })),
    //   settings: {
    //     currency: "INR",
    //   },

    //   bottomNotice: "Thanks for purchasing from Teapoy",
    // };

    const invoiceData = {
      images: {
        logo: "https://public.budgetinvoice.com/img/logo_en_original.png",
      },
      sender: {
        company: "Teapoy Private Limited",
      },
      client: {
        company: order.userId.name,
        address: order.billingDetails.address,
        zip: order.billingDetails.pincode,
        city: order.billingDetails.city,
        country: order.billingDetails.country,
      },
      information: {
        number: order.orderNumber,
        date: new Date(order.orderDate).toLocaleDateString(),
      },
      products: [
        // First add all products
        ...order.items.map((item) => ({
          description: item.product.title,
          quantity: item.quantity,
          price: item.price,
          "tax-rate": 0,
        })),
        // Then add discount as a negative value product
        {
          description: "Discount",
          price: -order.discount,
          "tax-rate": 0,
        },
      ],
      settings: {
        currency: "INR",
      },
      "bottom-notice": "Thanks for purchasing from Teapoy",
    };

    const result = await easyinvoice.createInvoice(invoiceData);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice.pdf`);
    res.send(Buffer.from(result.pdf, "base64"));
  } catch (error) {
    console.log(error);
  }
};

// ----------------------------------------  CART  ----------------------------------------------------------

const loadCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const cart = await Cart.findOne({ userId }).populate("items.product");
    // console.log(cart)
    const cartItems = cart ? cart.items : [];
    // console.log(cartItems)
    const coupons = await Coupon.find();
    // console.log();

    res.render("cart", { cartItems, cart, coupons });
  } catch (error) {
    console.log(error.message);
  }
};

const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.session.user._id;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    let currentQuantity = 0;
    if (existingItemIndex !== -1) {
      currentQuantity = cart.items[existingItemIndex].quantity;
    }

    const newQuantity = currentQuantity + quantity;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        message: `Insufficient stock. Only ${product.stock} units available.`,
      });
    }

    if (newQuantity > 5) {
      return res.status(400).json({
        message: "Maximum quantity of 5 reached for this product.",
      });
    }

    const priceToUse = product.isDiscounted
      ? product.offerPrice
      : product.price;

    if (existingItemIndex !== -1) {
      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = priceToUse;
    } else {
      cart.items.push({
        product: productId,
        price: priceToUse,
        quantity: newQuantity,
      });
    }

    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    await cart.save();

    return res.status(200).json({
      message: "Product added to cart successfully",
      cart: cart,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "An error occurred" });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const productId = req.params.id;
    const action = req.params.action; // "increment" or "decrement"
    // console.log(productId);
    // console.log(action);

    let userCart = await Cart.findOne({ userId: userId }).populate(
      "items.product"
    );
    // console.log(userCart);

    if (userCart) {
      const productInCart = userCart.items.find(
        (item) => item.product._id.toString() === productId
      );
      // console.log(productInCart);

      if (productInCart) {
        const product = await Product.findById(productId);
        const maxQuantity = product.stock;
        const priceToUse = product.isDiscounted
          ? product.offerPrice
          : product.price;
        // console.log(maxQuantity);

        if (action === "increment") {
          if (productInCart.quantity < maxQuantity) {
            productInCart.quantity += 1;
            productInCart.price = priceToUse;

            userCart.totalPrice = userCart.items.reduce(
              (total, item) => total + item.price * item.quantity,
              0
            );
            await userCart.save();

            return res.json({
              success: true,
              quantity: productInCart.quantity,
              price: productInCart.price,
              totalPrice: userCart.totalPrice,
            });
          } else {
            return res.json({
              success: false,
              message: "Maximum quantity reached for this product",
            });
          }
        } else if (action === "decrement" && productInCart.quantity > 1) {
          productInCart.quantity -= 1;
          productInCart.price = priceToUse;
          userCart.totalPrice = userCart.items.reduce(
            (total, item) => total + item.price * item.quantity,
            0
          );
          await userCart.save();
          return res.json({
            success: true,
            quantity: productInCart.quantity,
            price: productInCart.price,
            totalPrice: userCart.totalPrice,
          });
        } else {
          return res.json({
            success: false,
            message: "Invalid action or quantity",
          });
        }
      } else {
        return res.json({
          success: false,
          message: "Product not found in the cart",
        });
      }
    } else {
      res.json({ success: false, message: "User cart not found" });
    }
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteCartItem = async (req, res) => {
  const userId = req.session.user._id;
  const productId = req.params.productId;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.items.splice(itemIndex, 1);

    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    await cart.save();

    res.status(200).json({ message: "Product removed from cart successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error removing product from cart" });
  }
};

//-------------------------------------------------  SHOP  -----------------------------------------------------

const loadShop = async (req, res) => {
  try {
    const sortOption = req.query.sort;
    const selectedCategory = req.params.categoryName; // Retrieve from params

    let sortCriteria = {};
    switch (sortOption) {
      case "priceAsc":
        sortCriteria = { price: 1 };
        break;
      case "priceDesc":
        sortCriteria = { price: -1 };
        break;
      case "nameAsc":
        sortCriteria = { title: 1 };
        break;
      case "nameDesc":
        sortCriteria = { title: -1 };
        break;
      default:
        sortCriteria = {};
    }

    let filter = { isPublished: true };
    if (selectedCategory) {
      const category = await Category.findOne({
        category: selectedCategory,
        isListed: true,
      });
      if (category) {
        filter = { ...filter, category: category._id };
      }
    }

    const products = await Product.find(filter)
      .populate({
        path: "category",
        match: { isListed: true },
        select: "category",
      })
      .sort(sortCriteria);

    const filteredProducts = products.filter((product) => product.category);

    const categories = await Category.find({ isListed: true });

    res.render("shop", {
      products: filteredProducts,
      sortOption,
      categories,
      selectedCategory,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
};

const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const address = await Address.find({ userId: userId });
    // console.log(address)

    const cart = await Cart.findOne({ userId: userId }).populate(
      "items.product"
    );

    const user = await User.findById({ _id: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    userCart = cart.items;
    totalPrice = cart.totalPrice;
    discount = cart.discount;

    res.render("checkout", {
      address,
      cartItems: userCart,
      totalPrice: totalPrice,
      user,
      cart,
      discount: discount,
    });
  } catch (error) {
    console.error(error.message);
  }
};

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { addressID, paymentMethod, discount, totalPrice } = req.body;
    // console.log(req.body);

    const cart = await Cart.findOne({ userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).send("Your cart is empty.");
    }

    if (totalPrice > 5000 && paymentMethod === "COD") {
      return res.status(400).json({
        message: "orders above 1000 cannot be available for COD",
      });
    }

    const user = await User.findOne({ _id: userId });
    const address = await Address.findOne({ "addressDetails._id": addressID });
    const selectedAddress = address.addressDetails.find(
      (address) => address._id.toString() === addressID
    );

    const newOrder = new Order({
      userId: userId,
      items: cart.items.map((item) => ({
        product: item.product._id,
        price: item.price,
        quantity: item.quantity,
      })),
      totalPrice: totalPrice,
      billingDetails: {
        name: user.name,
        email: user.email,
        phno: user.phno,
        address: selectedAddress.address,
        pincode: selectedAddress.pincode,
        country: selectedAddress.country,
        state: selectedAddress.state,
        city: selectedAddress.city,
      },
      paymentMethod,
      paymentStatus: "Paid",
      status: "Pending",
      discount,
      orderNumber: uuidv4(),
    });

    await newOrder.save();

    for (let item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    await Cart.findOneAndDelete({ userId });

    if (paymentMethod === "COD") {
      return res
        .status(200)
        .json({ message: "Order placed successfully!", orderId: newOrder._id });
    } else if (paymentMethod === "Razorpay") {
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: newOrder.totalPrice * 100,
        currency: "INR",
        receipt: newOrder._id.toString(),
        notes: {
          userId: userId.toString(),
        },
      });

      return res.status(200).json({
        message: "Razorpay order created successfully!",
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: newOrder._id,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server error while placing the order.");
  }
};

const loadOrderConfirm = async (req, res) => {
  try {
    const { orderId } = req.params;

    // console.log(orderId);
    const order = await Order.findById(orderId).populate("items.product");

    if (!order) {
      return res.status(404).send("Order not found.");
    }

    res.render("orderConfirm", { order });
  } catch (error) {
    console.error("Order Confirmation Error:", error);
    res.status(500).send("Server error while fetching the order.");
  }
};

//  -----------------------------------------------  wishlist  --------------------------------------------

const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const wishlistItems = await Wishlist.findOne({ userId: userId }).populate(
      "items.product"
    );
    // console.log(wishlistItems);
    const items = wishlistItems ? wishlistItems.items : [];

    res.render("wishlist", { items, wishlistItems });
  } catch (error) {
    console.log(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const productID = req.params.id;

    const product = await Product.findById(productID);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    let userWishlist = await Wishlist.findOne({ userId: userId });

    if (!userWishlist) {
      userWishlist = new Wishlist({
        userId: userId,
        items: [{ product: productID }],
      });
      await userWishlist.save();

      product.inWishlist = true;
      await product.save();

      return res
        .status(200)
        .json({ success: true, message: "Product added to wishlist" });
    }

    const existingProduct = userWishlist.items.find(
      (item) => item.product.toString() === productID.toString()
    );

    if (existingProduct) {
      return res.status(200).json({
        success: false,
        message: "Product already exists in wishlist",
      });
    }

    userWishlist.items.push({ product: productID });
    await userWishlist.save();

    product.inWishlist = true;
    await product.save();

    return res
      .status(200)
      .json({ success: true, message: "Product added to wishlist" });
  } catch (err) {
    next(err);
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const productId = req.params.id;

    let userWishlist = await Wishlist.findOne({ userId: userId });

    if (!userWishlist) {
      return res
        .status(404)
        .json({ success: false, message: "Wishlist not found" });
    }

    const productIndex = userWishlist.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in wishlist" });
    }

    userWishlist.items.splice(productIndex, 1);
    await userWishlist.save();

    await Product.findByIdAndUpdate(productId, { inWishlist: false });

    return res
      .status(200)
      .json({ success: true, message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Error removing product from wishlist:", error);
    return res
      .status(500)
      .json({ success: false, message: "An error occurred" });
  }
};

const loadWallet = async (req, res) => {
  try {
    const userId = req.session.user._id;
    let wallet = await Wallet.findOne({ userId: userId }).populate("userId");
    const transactions = await Transaction.find({ userId: userId });

    // console.log("User ID:", userId, "Wallet:", wallet);

    if (!wallet) {
      wallet = new Wallet({
        userId: userId,
        balance: 0,
      });
      await wallet.save();
    }

    res.render("wallet", { wallet, transactions });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadSearch = async (req, res) => {
  try {
    const { searchTerm } = req.query;

    const searchCriteria = {
      isPublished: true,
      $or: [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ],
    };

    const products = await Product.find(searchCriteria).populate({
      path: "category",
      match: { isListed: true },
      select: "category",
    });
    res.render("search", { products, searchTerm });
  } catch (error) {
    console.log(error);
  }
};

//==========================================  COUPON  ==========================================================

const getCoupon = async (req, res) => {
  try {
    const totalPrice = req.query.totalPrice;
    const userId = req.session.user._id;
    const currentDate = new Date();
    // console.log(totalPrice);

    const coupons = await Coupon.find({
      minAmount: { $lte: totalPrice },
      expiryDate: { $gte: currentDate },
      isListed: true,
      usedBy: { $ne: userId },
    });

    // console.log(coupons)

    res.json({ coupons });
  } catch (error) {
    console.log("error fetching coupons : ", error);
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.user._id;

    const coupon = await Coupon.findOne({ couponCode: couponCode });
    if (!coupon) {
      return res.json({ message: "coupon not found" });
    }

    const userCart = await Cart.findOne({ userId });
    if (!userCart) {
      return res.json({ message: "cart not found" });
    }

    let discount = 0;
    if (coupon.discountPercentage) {
      discount = (userCart.totalPrice * coupon.discountPercentage) / 100;
      if (discount > coupon.maxDiscountAmount) {
        discount = Math.min(discount, parseInt(coupon.maxDiscountAmount));
      }
      discount = Math.floor(discount);
    }

    const newTotalPrice = userCart.totalPrice - discount;

    userCart.discount = discount;
    userCart.totalPrice = newTotalPrice;
    await userCart.save();

    coupon.usedBy.push(userId);
    await coupon.save();

    return res.json({
      message: "coupon applied successfully",
      newTotalPrice,
      discount,
    });
  } catch (error) {
    console.log("error applying coupon", error);
  }
};

const cancelCoupon = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userCart = await Cart.findOne({ userId });
    const { couponCode, totalPrice } = req.body;

    // console.log(couponCode, userId);
    // console.log(userCart);

    if (!userCart) {
      return res.json({ message: "cart not found" });
    }

    const coupon = await Coupon.findOne({ couponCode, usedBy: userId });
    if (!coupon) {
      return res.json({ message: "coupon not found or not used by user" });
    }

    coupon.usedBy = coupon.usedBy.filter(
      (id) => id.toString() !== userId.toString()
    );

    await coupon.save();

    // const oldTotalPrice=
    // console.log(totalPrice, userCart.discount)
    userCart.totalPrice += userCart.discount;
    userCart.discount = 0;
    await userCart.save();

    // console.log(userCart.totalPrice);
    const originalTotalPrice = userCart.totalPrice;
    // console.log(typeof originalTotalPrice, originalTotalPrice);
    return res.json({ originalTotalPrice });
  } catch (error) {
    console.log("error cancelling coupon", error);
  }
};

module.exports = {
  loadRegister,
  loadLogin,
  insertUser,
  verifyOtp,
  loadOtpVerification,
  verifyLogin,
  loadHome,
  resendOtp,
  loadProductDetails,
  loadForgotPasswordEmailVerification,
  loadResetPassword,
  verifyForgotPasswordEmail,
  resetPassword,
  logout,
  loadProfile,
  verifyEditProfile,
  verifyChangePassword,
  loadAddress,
  verifyAddAddress,
  verifyEditAddress,
  deleteAddress,
  loadAddAddress,
  loadEditAddress,
  getOrderInvoice,
  loadCart,
  addToCart,
  updateCartQuantity,
  deleteCartItem,
  loadShop,
  loadCheckout,
  placeOrder,
  loadOrderConfirm,
  loadMyOrders,
  loadOrderDetails,
  loadWishlist,
  addToWishlist,
  removeFromWishlist,
  orderCancel,
  loadWallet,
  returnOrder,
  googleAuth,
  verifyPaymentAndCreateOrder,
  createRazorpayOrder,
  loadSearch,
  getCoupon,
  applyCoupon,
  cancelCoupon,
  retryPayment,
  verifyRetryPayment,
};
