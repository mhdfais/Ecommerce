const { error } = require("console");
const User = require("../Models/userModel");
const userOtpVerification = require("../Models/userOtpVerification");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

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

const sendOtpVerificationEmail = async ({ _id, email }, res) => {
  // console.log(`${_id}  11`)/////////////////////////////////
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
    const newOtpVerification = await new userOtpVerification({
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
    // console.log("1"); ///////

    req.flash("pswdMatch", "Passwords do not match");
    return res.redirect("/register");
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // console.log("2"); //////

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
    sendOtpVerificationEmail(newUser, res);
    // console.log("4"); ///////////

    res.redirect(`/otp-verification?userId=${newUser._id}`);
    // console.log('redirect')
    // console.log(newUser._id)
  } catch (error) {
    console.log(error);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    // console.log(userId, otp);

    if (!userId || !otp) {
      console.log("3"); ////////////

      return res.redirect(`/otp-verification?userId=${userId}`);
    }

    // Fetch OTP record for the user
    const userOtpVerificationRecord = await userOtpVerification.findOne({
      userId,
    });

    // Check if OTP has expired
    const { expiresAt, otp: hashedOtp } = userOtpVerificationRecord;
    if (expiresAt < Date.now()) {
      await userOtpVerification.deleteMany({ userId });
      req.flash("expired", "OTP has expired");
      return res.redirect(`/otp-verification?userId=${userId}`);
    }

    // Compare provided OTP with hashed OTP in the database
    const validOtp = await bcrypt.compare(otp, hashedOtp);
    if (!validOtp) {
      //   req.flash("error", "Invalid OTP");
      return res.redirect(`/otp-verification?userId=${userId}`);
    }

    // Mark user as verified
    await User.updateOne({ _id: userId }, { isVerified: true });

    // Remove OTP record after successful verification
    await userOtpVerification.deleteMany({ userId });

    // Redirect to login or any other page
    // req.flash("success", "OTP verified successfully");
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

const verifyLogin = async (req, res) => {
  const { email, pswd } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(pswd, user.pswd))) {
      return res.redirect("/login");
    }
    res.redirect("/home");
  } catch (error) {
    console.log(error.message);
  }
};

// const verifyOtp = async (req, res) => {
//   try {
//     let { userId, otp } = req.body;
//     if (!userId || !otp) {
//       return res.redirect("/otp-verification");
//     } else {
//       const userOtpVerificationRecords = await userOtpVerification.find({
//         userId,
//       });
//       if (userOtpVerificationRecords.length <= 0) {
//         req.flash("exist", "account doesnt exit or already verified");
//         return res.redirect("/otp-verification");
//       } else {
//         const { expiresAt } = userOtpVerificationRecords[0];
//         const hashedOTP = userOtpVerificationRecords[0].otp;

//         if (expiresAt < Date.now()) {
//           await userOtpVerification.deleteMany({ userId });
//           req.flash("expired", "code expired");
//           return res.redirect("/otp-verification");
//         } else {
//           const validOtp = await bcrypt.compare(otp, hashedOTP);

//           if (!validOtp) {
//             req.flash("invalidCode", "invalid code");
//             return res.redirect("/otp-verification");
//           } else {
//             await User.updateOne({ _id: userId }, { isVerified: true });
//             await userOtpVerification.deleteMany({ userId });
//             res.render("login");
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.log(error.message);
//   }
// };

const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const loadOtpVerification = async (req, res) => {
  try {
    const userId = req.query.userId;
    // console.log(userId);///////

    if (!userId) {
      console.log("user id not got from register"); //////
      return res.redirect("/register");
    }
    console.log("user id got from register"); //////

    const user = await User.findById(userId);
    // const user = await User.findById(mongoose.Types.ObjectId(userId));
    // console.log(user);

    if (!user) {
      console.log("no user finded from user by user id"); /////////
      return res.redirect("/register");
    }
    console.log("user finded from user by user id"); /////////

    // console.log(userId)////////////
    const otpRecord = await userOtpVerification.findOne({ userId });
    // const otpRecord = await userOtpVerification.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!otpRecord) {
      console.log("no otp record found"); /////
      return res.redirect("/register");
    }
    console.log("otp record found"); ///////////////////////////////

    const expired = req.flash("expired");
    res.render("otp-verification", {
      userId,
      expiresAt: otpRecord.expiresAt.getTime(),
      expired,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    res.render("home");
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
};
