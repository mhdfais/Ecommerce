const User = require("../Models/userModel");
const userOtpVerification = require("../Models/userOtpVerification");
const Product = require("../Models/product");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const product = require("../Models/product");
const crypto = require("crypto");
const Address = require("../Models/address");
const Cart = require("../Models/cart");
const Order = require("../Models/orders");
const { error } = require("console");

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

// --------------------------------------------------  OTP  -----------------------------------------------

// const loadOtpVerification = async (req, res) => {
//   try {
//     const userId = req.query.userId;
//     if (!userId) {
//       return res.redirect("/register");
//     }

//     const user = await User.findById(userId);

//     if (!user) {
//       return res.redirect("/register");
//     }

//     await sendOtpVerificationEmail(user, res);

//     const otpRecord = await userOtpVerification.findOne({ userId });
//     if (!otpRecord) {
//       return res.redirect("/register");
//     }

//     const invalid = req.flash("invalid");
//     res.render("otp-verification", {
//       userId,
//       expiresAt: otpRecord.expiresAt.getTime(),
//       invalid,
//     });
//   } catch (error) {
//     console.log(error.message);
//   }
// };

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

// const insertUser = async (req, res) => {
//   const { name, email, phno, pswd, confirmPswd } = req.body;
//   if (pswd !== confirmPswd) {
//     req.flash("pswdMatch", "Passwords do not match");
//     return res.redirect("/register");
//   }
//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       req.flash("emailExist", "User already exists");
//       return res.redirect("/register");
//     }
//     const hashedPswd = await bcrypt.hash(pswd, 10);
//     const newUser = new User({
//       name,
//       email,
//       phno,
//       pswd: hashedPswd,
//     });
//     await newUser.save();

//     await sendOtpVerificationEmail(newUser, res);
//     res.redirect(`/otp-verification?userId=${newUser._id}`);
//   } catch (error) {
//     console.log(error);
//   }
// };

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

// const loadHome = async (req, res) => {
//   try {
//     const products = await Product.find({ isPublished: true }).populate(
//       "category",
//       "category"
//     );
//     res.render("home", { products });
//   } catch (error) {
//     console.log(error.message);
//   }
// };

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
    const orders = await Order.find({ userId: userId });
    res.render("myOrders", { orders });
  } catch (error) {
    console.log(error.message);
  }
};

const loadOrderDetails=async(req,res)=>{
  try {
    const orderId=req.params.orderId
    const orders=await Order.findById(orderId).populate('items.product')
    res.render('orderDetails',{orders})
  } catch (error) {
    console.log(error.message)
  }
}

// ----------------------------------------  CART  ----------------------------------------------------------

const loadCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const cart = await Cart.findOne({ userId }).populate("items.product");
    const cartItems = cart ? cart.items : [];
    // console.log();

    res.render("cart", { cartItems, cart });
  } catch (error) {
    console.log(error.message);
  }
};

// const addToCart = async (req, res) => {
//   // console.log("addToCart called");
//   // console.log("Product ID:", req.body.productId);
//   // console.log(req.body.quantity, req.session.user);
//   const { productId, quantity } = req.body;
//   const userId = req.session.user._id;

//   try {
//     const product = await Product.findById(productId);

//     if (!product) {
//       // console.log(1); ////////////////
//       return res.status(404).json({ message: "Product not found" });
//     }

//     let cart = await Cart.findOne({ userId });

//     if (!cart) {
//       // console.log(2);
//       cart = new Cart({ userId, items: [] });
//     }

//     const existingItemIndex = cart.items.findIndex(
//       (item) => item.product.toString() === productId
//     );

//     // console.log(existingItemIndex);

//     if (existingItemIndex !== -1) {
//       cart.items[existingItemIndex].quantity += quantity;
//     } else {
//       cart.items.push({
//         product: productId,
//         price: product.price,
//         quantity: quantity,
//       });
//     }

//     cart.totalPrice = cart.items.reduce(
//       (total, item) => total + item.price * item.quantity,
//       0
//     );
//     // console.log(cart);
//     await cart.save();

//     return res
//       .status(200)
//       .json({ message: "Product added to cart successfully" });
//   } catch (error) {
//     console.log(error.message);
//   }
// };

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

    if (existingItemIndex !== -1) {
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        product: productId,
        price: product.price,
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
  const { productId, quantityChange } = req.body;
  const userId = req.session.user._id;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(400).json({ message: "Cart not found" });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingItemIndex === -1) {
      return res.status(400).json({ message: "Product not found in cart" });
    }

    const newQuantity = cart.items[existingItemIndex].quantity + quantityChange;

    if (newQuantity > product.stock) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    if (newQuantity > 5) {
      return res
        .status(400)
        .json({ message: "Maximum quantity of 5 reached for this product" });
    }

    if (newQuantity < 1) {
      return res
        .status(400)
        .json({ message: "Quantity cannot be less than 1" });
    }

    cart.items[existingItemIndex].quantity = newQuantity;

    cart.items[existingItemIndex].price = product.price * newQuantity;

    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    await cart.save();

    return res.status(200).json({ message: "Quantity updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
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

    cart.items.splice(itemIndex, 1); // Remove the product from the cart

   
    cart.totalPrice = cart.items.reduce(      // Update total price
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

    const products = await Product.find({ isPublished: true })
      .populate({
        path: "category",
        match: { isListed: true },
        select: "category",
      })
      .sort(sortCriteria);

    const filteredProducts = products.filter((product) => product.category);

    res.render("shop", { products: filteredProducts });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
};

// const getSortedProducts = async (req, res) => {
//   try {
//     const sortOption = req.query.sort; // Capture the sort option from the query string

//     let sortCriteria = {};

//     // Map the query to the actual sort fields in your database
//     switch (sortOption) {
//       case "priceAsc":
//         sortCriteria = { price: 1 }; // Ascending
//         break;
//       case "priceDesc":
//         sortCriteria = { price: -1 }; // Descending
//         break;
//       case "nameAsc":
//         sortCriteria = { title: 1 }; // Alphabetical A-Z
//         break;
//       case "nameDesc":
//         sortCriteria = { title: -1 }; // Alphabetical Z-A
//         break;
//       default:
//         sortCriteria = {}; // Default sort (e.g., by date or relevance)
//         break;
//     }

//     // Fetch products from the database with applied sorting
//     const products = await Product.find().sort(sortCriteria);

//     // Pass sorted products to the view for rendering
//     res.render("shop", { products });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Server Error");
//   }
// };

const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const address = await Address.find({ userId: userId });
    // console.log(address)

    const cart = await Cart.findOne({ userId: userId }).populate(
      "items.product"
    );

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    userCart = cart.items;
    totalPrice = cart.totalPrice;

    res.render("checkout", {
      address,
      cartItems: userCart,
      totalPrice: totalPrice,
    });
  } catch (error) {
    console.error(error.message);
  }
};

// const placeOrder = async (req, res) => {
//   try {
//     const userId = req.session.user._id;
//     // console.log(userId);
//     const { addressID, paymentMethod } = req.body;
//     // console.log(addressID)
//     // console.log(paymentMethod)

//     const cart = await Cart.findOne({ userId }).populate("items.product");
//     // console.log(cart)///////////////

//     if (!cart && cart.items.length === 0) {
//       return res.status(400).send("Your cart is empty.");
//     }

//     const address = await Address.findOne({ "addressDetails._id": addressID });
//     // console.log(address)////////////
//     const selectedAddress = address.addressDetails.find(
//       (address) => address._id.toString() === addressID
//     );
//     // console.log(selectedAddress)//////////////////

//     if (!selectedAddress) {
//       return res.status(400).send("Invalid address selected.");
//     }

//     const user = await User.findOne({ _id: userId });
//     // console.log(user);

//     const newOrder = new Order({
//       userId: user._id,
//       items: cart.items.map((item) => ({
//         product: item.product._id,
//         price: item.price,
//         quantity: item.quantity,
//       })),
//       totalPrice: cart.totalPrice,
//       billingDetails: {
//         name: user.name,
//         email: user.email,
//         phno: user.phno,
//         address: selectedAddress.address,
//         country: selectedAddress.country,
//         state: selectedAddress.state,
//         pincode: selectedAddress.pincode,
//         city: selectedAddress.city,
//       },
//       paymentMethod: paymentMethod,
//       paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
//       status: "Pending",
//     });

//     await newOrder.save();

//     const productUpdatePromise = cart.items.map(async (item) => {
//       const product = await Product.findById(item.product._id);

//       if (product.stock >= item.quantity) {
//         product.stock -= item.quantity;
//         await product.save();
//       } else {
//         throw new error(`not enough stock for the product ${product.title}`);
//       }

//       await Promise.all(productUpdatePromise);
//       await Cart.findByIdAndDelete({ userId: userId });

//       res
//         .status(200)
//         .json({ message: "Order placed successfully!", orderId: newOrder._id });
//     });
//   } catch (error) {
//     console.log(error.message);
//   }
// };

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { addressID, paymentMethod } = req.body;

    const cart = await Cart.findOne({ userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).send("Your cart is empty.");
    }

    const user = await User.findOne({ _id: userId });

    const address = await Address.findOne({ "addressDetails._id": addressID });
    // console.log(address)////////////
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
      paymentMethod,
      paymentStatus: "Pending",
      status: "Pending",
    });

    await newOrder.save();

    for (let item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    await Cart.findOneAndDelete({ userId });

    res
      .status(200)
      .json({ message: "Order placed successfully!", orderId: newOrder._id });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error while placing the order.");
  }
};

const loadOrderConfirm = async (req, res) => {
  try {
    const { orderId } = req.params;

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
};
