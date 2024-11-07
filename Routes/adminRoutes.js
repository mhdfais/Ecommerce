const express = require("express");
const admin_route = express();

admin_route.set("view engine", "ejs");
admin_route.set("views", "./Views/Admin");

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));

const session = require("express-session");
admin_route.use(
  session({
    secret: "admin_security_key",
    resave: false,
    saveUninitialized: false,
  })
);

const adminController = require("../Controller/adminController");
const dashboardController = require("../Controller/dashboardController");
const isAdmin = require("../Middlewares/adminAuth");
// const upload = require("../Controller/adminController");\

// authentication
admin_route.get("/adminLogin", adminController.loadAdminLogin);
admin_route.post("/verifyAdmin", adminController.verifyAdminLogin);
admin_route.get("/admin-logout", adminController.adminLogout);

// dashboard
admin_route.get("/dashboard", isAdmin, dashboardController.loadDashboard);

// Customer
admin_route.get("/customer", isAdmin, adminController.loadCustomer);
admin_route.post("/block-user/:id", adminController.blockUser);
admin_route.post("/unblock-user/:id", adminController.unBlockUser);
admin_route.get("/users", isAdmin, adminController.getPaginatedUsers);

//  Category
admin_route.get("/category", isAdmin, adminController.loadCategory);
admin_route.get("/add-category", isAdmin, adminController.loadAddCategory);
admin_route.post("/insert-category", adminController.insertCategory);
admin_route.post("/list-category/:id", adminController.listCategory);
admin_route.post("/unlist-category/:id", adminController.unListCategory);
admin_route.get("/edit-category/:id", adminController.loadEditCategory);
admin_route.post("/edit-category/:id", adminController.verifyEditCategory);

//  Brand
admin_route.get("/brand", isAdmin, adminController.loadBrand);
admin_route.get("/add-brand", isAdmin, adminController.loadAddBrand);
admin_route.post("/insert-brand", adminController.insertBrand);
admin_route.get("/edit-brand/:id", adminController.loadEditBrand);
admin_route.post("/edit-brand/:id", adminController.verifyEditBrand);
admin_route.post("/list-brand/:id", adminController.listBrand);
admin_route.post("/unlist-brand/:id", adminController.unListBrand);

// Product
admin_route.get("/product", isAdmin, adminController.loadProduct);
admin_route.get("/add-product", isAdmin, adminController.loadAddProduct);
admin_route.post(
  "/insert-product",
  adminController.upload,
  adminController.insertProduct
);
admin_route.post("/publish-product/:id", adminController.publishProduct);
admin_route.post("/unpublish-product/:id", adminController.unPublishProduct);
admin_route.get("/edit-product/:id", isAdmin, adminController.loadEditProduct);
admin_route.post(
  "/edit-product/:id",
  adminController.upload,
  adminController.verifyEditProduct
);
admin_route.get("/products", isAdmin, adminController.getPaginatedProducts);

// orders
admin_route.get("/order", isAdmin, adminController.loadOrder);
admin_route.get(
  "/adminOrderDetails/:orderId",
  isAdmin,
  adminController.loadAdminOrderDetails
);
admin_route.post("/updateStatus", adminController.updateStatus);
admin_route.get(
  "/adminOrderCancel/:orderId",
  isAdmin,
  adminController.adminOrderCancel
);
admin_route.get("/orders", isAdmin, adminController.getPaginatedOrders);

//   coupons
admin_route.get("/coupon", isAdmin, adminController.loadCoupon);
admin_route.get("/coupon/add-coupon", isAdmin, adminController.loadAddCoupon);
admin_route.post("/coupon/add-coupon", adminController.insertCoupon);
admin_route.delete("/coupon/delete-coupon/:id", adminController.deleteCoupon);

//offers
admin_route.get("/offer", isAdmin, adminController.loadOffer);
admin_route.get("/offer/add-offer", isAdmin, adminController.loadAddOffer);
admin_route.post("/offer/add-offer", isAdmin, adminController.insertOffer);
admin_route.post("/offer/list-offer/:id", isAdmin, adminController.listOffer);
admin_route.post(
  "/offer/unlist-offer/:id",
  isAdmin,
  adminController.unListOffer
);

//sales report
admin_route.get("/salesReport", isAdmin, adminController.loadSalesReport);

//  best selling
admin_route.get("/bestCategory", isAdmin, adminController.loadBestCategory);
admin_route.get("/bestProduct", isAdmin, adminController.loadBestProduct);
admin_route.get("/bestBrand", isAdmin, adminController.loadBestBrand);

module.exports = admin_route;
