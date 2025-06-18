const express = require("express");
const user_route = express();

const userController = require("../Controller/userController");

const isUser = require("../Middlewares/userAuth");
const checkBlocked = require("../Middlewares/isBlocked");
const authController = require("../config/passport");
const passport = require("passport");

user_route.set("view engine", "ejs");
user_route.set("views", "./Views/User");

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

user_route.use(express.static("public"));

const session = require("express-session");

user_route.use(
  session({
    secret: "something_key",
    resave: false,
    saveUninitialized: false,
  })
);

// user_route.get('/auth/google', authController.googleAuth);
// user_route.get('/auth/google/callback', authController.googleAuthCallback);

user_route.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// Route to handle Google callback (after Google login)
user_route.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  userController.googleAuth
);

user_route.get('/',userController.loadLandingPage)

// authentication
user_route.get("/register", userController.loadRegister);
user_route.get("/login", userController.loadLogin);
user_route.get("/otp-verification", userController.loadOtpVerification);
user_route.post("/register", userController.insertUser);
user_route.post("/verify-otp", userController.verifyOtp);
user_route.post("/verifyLogin", userController.verifyLogin);
user_route.get("/resendOtp", userController.resendOtp);

// forgot pasword
user_route.get(
  "/forgot-password",
  userController.loadForgotPasswordEmailVerification
);
user_route.get("/reset-password/:token", userController.loadResetPassword);
user_route.post("/forgot-password", userController.verifyForgotPasswordEmail);
user_route.post("/reset-password", isUser, userController.resetPassword);

// home
user_route.get("/home", isUser, userController.loadHome);

// product
user_route.get(
  "/product-details/:id",
  isUser,
  userController.loadProductDetails
);

//  Profile
user_route.get("/profile", isUser, userController.loadProfile);
user_route.post("/edit-profile/:id", userController.verifyEditProfile);
user_route.post("/profile-changePswd/:id", userController.verifyChangePassword);

// address
user_route.get("/address", isUser, userController.loadAddress);
user_route.get("/add-address", isUser, userController.loadAddAddress);
user_route.post("/add-address", userController.verifyAddAddress);
user_route.get("/edit-address/:id", isUser, userController.loadEditAddress);
user_route.post("/edit-address", userController.verifyEditAddress);
user_route.delete("/delete-address/:addressId", userController.deleteAddress);

// My orderss
user_route.get("/home/account/myOrders", isUser, userController.loadMyOrders);
user_route.get(
  "/home/account/myOrders/orderDetails/:orderId",
  isUser,
  userController.loadOrderDetails
);
user_route.get("/orderCancel/:orderId", isUser, userController.orderCancel);
user_route.post("/order/return", isUser, userController.returnOrder);
user_route.post('/home/account/myOrders/retry-payment',userController.retryPayment)
user_route.post('/home/account/myOrders/verify-retry-payment',userController.verifyRetryPayment)
user_route.get('/home/account/myOrders/orderDetails/downloadInvoice/:id',userController.getOrderInvoice)

// cart
user_route.get("/home/cart", isUser, userController.loadCart);
user_route.post("/home/addToCart", isUser, userController.addToCart);
user_route.post(
  "/home/cart/updateQuantity/:id/:action",
  isUser,
  userController.updateCartQuantity
);
user_route.delete(
  "/home/cart/removeItem/:productId",
  isUser,
  userController.deleteCartItem
);

// user_route.post("/home/cart/apply-coupon", isUser, userController.applyCoupon);
// user_route.post(
//   "/home/cart/remove-coupon",
//   isUser,
//   userController.removeCoupon
// );

// shop

user_route.get("/home/shop", isUser, userController.loadShop);
user_route.get("/home/shop/category/:categoryName", isUser, userController.loadShop);

// checkout, placeorder
user_route.get("/home/cart/checkout", isUser, userController.loadCheckout);
user_route.post(
  "/home/cart/checkout/placeorder",
  isUser,
  userController.placeOrder
);
user_route.get(
  "/home/cart/checkout/placeorder/order-confirm/:orderId",
  isUser,
  userController.loadOrderConfirm
);

// razorpay
user_route.post(
  "/home/cart/checkout/verify-payment",
  isUser,
  userController.verifyPaymentAndCreateOrder
);
user_route.post(
  "/home/cart/checkout/razorpay-order",
  isUser,
  userController.createRazorpayOrder
);

//  wishlist
user_route.get("/home/wishlist", isUser, userController.loadWishlist);
user_route.post("/wishlist/add/:id", isUser, userController.addToWishlist);
user_route.delete(
  "/wishlist/remove/:id",
  isUser,
  userController.removeFromWishlist
);

// coupon
user_route.get('/home/cart/checkout/getCoupon', isUser, userController.getCoupon)
user_route.post('/home/cart/checkout/applyCoupon', isUser, userController.applyCoupon)
user_route.post('/home/cart/checkout/cancelCoupon', isUser, userController.cancelCoupon)

user_route.get("/home/shop/search", isUser, userController.loadSearch);

// wallet
user_route.get("/home/account/wallet", isUser, userController.loadWallet);

// logout
user_route.get("/logout", userController.logout);

module.exports = user_route;
