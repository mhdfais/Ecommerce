const { error } = require("console");
const User = require("../Models/userModel");
const userOtpVerification = require("../Models/userOtpVerification");
const Product = require("../Models/product");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const product = require("../Models/product");
const crypto = require("crypto");

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
      req.flash("emailExist", "User already exists");
      return res.redirect("/register");
    }
    const hashedPswd = await bcrypt.hash(pswd, 10);
    const newUser = new User({
      name,
      email,
      phno,
      pswd: hashedPswd,
    });
    await newUser.save();

    await sendOtpVerificationEmail(newUser, res);
    res.redirect(`/otp-verification?userId=${newUser._id}`);
  } catch (error) {
    console.log(error);
  }
};

// const insertUser = async (req, res) => {
//   const { name, email, pswd, confirmPswd, phno } = req.body;

//   if (pswd != confirmPswd) {
//     req.flash("pswdMatch", "Passwords do not match");
//     return res.redirect("/register");
//   }

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       if (!existingUser.isVerified) {
//         const hashedPswd = await bcrypt.hash(pswd, 10);
//         existingUser.name = name;
//         existingUser.phno = phno;
//         existingUser.pswd = hashedPswd;
//         await existingUser.save();

//         await userOtpVerification.deleteOne({ userId: existingUser._id });

//         return res.redirect(`/otp-verification?userId=${existingUser._id}`);
//       } else {
//         req.flash("emailExist", "User already exists");
//         return res.redirect("/register");
//       }
//     }

//     const hashedPswd = await bcrypt.hash(pswd, 10);
//     const newUser = new User({
//       name,
//       email,
//       phno,
//       pswd: hashedPswd,
//     });
//     await newUser.save();
//     res.redirect(`/otp-verification?userId=${newUser._id}`);
//   } catch (error) {
//     console.log(error.message);
//   }
// };

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

    req.session.user = user;
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
    const products = await Product.find({ isPublished: true }).populate(
      "category",
      "category"
    );
    res.render("home", { products });
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
};
