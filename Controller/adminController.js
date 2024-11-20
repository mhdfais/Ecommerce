const User = require("../Models/userModel");
const Category = require("../Models/category");
const Brand = require("../Models/brand");
const Product = require("../Models/product");
const Order = require("../Models/orders");
const Coupon = require("../Models/coupon");
const Wallet = require("../Models/wallet");
const Transaction = require("../Models/transaction");
const Offer = require("../Models/offer");
const multer = require("multer");
const dayjs = require("dayjs");

// -------------------------------------------  multer  ------------------------------------------------------

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./Public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

let upload = multer({
  storage: storage,
}).array("image", 10);

// ------------------------------------------------  ADMIN  --------------------------------------------------

const loadAdminLogin = async (req, res) => {
  try {
    if (!req.session.admin) {
      const fail = req.flash("fail");
      res.render("adminLogin", { fail });
    } else {
      res.render("dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const email = "admin@gmail.com";
const pswd = "54321";

const verifyAdminLogin = async (req, res) => {
  try {
    if (req.body.email === email && req.body.pswd === pswd) {
      req.session.admin = req.body.email;
      res.redirect("/dashboard");
    } else {
      req.flash("fail", "invalid credential");
      res.redirect("/adminLogin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const adminLogout = async (req, res) => {
  try {
    req.session.admin = null;
    res.redirect("/adminLogin");
  } catch (error) {
    console.log(error.message);
  }
};

// ----------------------------------------------  CUSTOMER  -------------------------------------------

const blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, { isBlocked: true });
    res.redirect("/customer");
  } catch (error) {
    console.log(error.message);
  }
};

const unBlockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, { isBlocked: false });
    res.redirect("/customer");
  } catch (error) {
    console.log(error.message);
  }
};

const loadCustomer = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const skip = (page - 1) * limit;

    const totalCustomers = await User.countDocuments({ isVerified: true });

    const totalPages = Math.ceil(totalCustomers / limit);

    const customers = await User.find({ isVerified: true })
      .skip(skip)
      .limit(limit);

    res.render("customer", {
      user: customers,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
};

const getPaginatedUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments({ isVerified: true });

    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find({ isVerified: true }).skip(skip).limit(limit);

    res.render("customer", {
      user: users,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
};

// -----------------------------------------------------  CATEGORY  ---------------------------------------------

const loadCategory = async (req, res) => {
  try {
    const data = await Category.find();
    res.render("category", { data });
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddCategory = async (req, res) => {
  try {
    const cateExist = req.flash("cateExist");
    res.render("addCategory", { cateExist });
  } catch (error) {
    console.log(error.message);
  }
};

const insertCategory = async (req, res) => {
  const { categoryName, description } = req.body;
  try {
    const existingCategory = await Category.findOne({ category: categoryName });
    if (existingCategory) {
      req.flash("cateExist", "category already exist");
      return res.redirect("/add-category");
    }
    const newCategory = new Category({
      category: categoryName,
      description,
    });
    await newCategory.save();
    res.redirect("/category");
  } catch (error) {
    error.message;
  }
};

const unListCategory = async (req, res) => {
  try {
    const id = req.params.id;
    await Category.findByIdAndUpdate(id, { isListed: false });
    res.redirect("/category");
  } catch (error) {
    console.log(error.message);
  }
};

const listCategory = async (req, res) => {
  try {
    const id = req.params.id;
    await Category.findByIdAndUpdate(id, { isListed: true });
    res.redirect("/category");
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Category.findById(id);
    if (!data) {
      return res.send("category not found");
    }
    res.render("editcategory", { data });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyEditCategory = async (req, res) => {
  const { categoryName, description } = req.body;
  const id = req.params.id;
  try {
    await Category.findByIdAndUpdate(id, {
      category: categoryName,
      description,
    });
    res.redirect("/category");
  } catch (error) {
    console.log(error.message);
  }
};

// ----------------------------------------------------  BRAND  -----------------------------------------------

const loadBrand = async (req, res) => {
  try {
    const data = await Brand.find();
    res.render("brand", { data });
  } catch (error) {
    console.log(error.message);
  }
};

const loadAddBrand = async (req, res) => {
  try {
    res.render("addBrand");
  } catch (error) {
    console.log(error.message);
  }
};

const insertBrand = async (req, res) => {
  const { brandName, description } = req.body;
  try {
    const newBrand = new Brand({
      brand: brandName,
      description,
    });
    await newBrand.save();
    res.redirect("/brand");
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditBrand = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Brand.findById(id);
    if (!data) {
      return res.send("not found");
    }
    res.render("editBrand", { data });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyEditBrand = async (req, res) => {
  const { brandName, description } = req.body;
  try {
    const id = req.params.id;
    await Brand.findByIdAndUpdate(id, {
      brand: brandName,
      description,
    });
    res.redirect("/brand");
  } catch (error) {
    console.log(error.message);
  }
};

const listBrand = async (req, res) => {
  try {
    const id = req.params.id;
    await Brand.findByIdAndUpdate(id, { isListed: true });
    res.redirect("/brand");
  } catch (error) {
    console.log(error.message);
  }
};

const unListBrand = async (req, res) => {
  try {
    const id = req.params.id;
    await Brand.findByIdAndUpdate(id, { isListed: false });
    res.redirect("/brand");
  } catch (error) {
    console.log(error.message);
  }
};

// ---------------------------------------------------  PRODUCT  ---------------------------------------------

const loadProduct = async (req, res) => {
  const limit = 5;
  const page = parseInt(req.query.page) || 1;

  try {
    const totalItems = await Product.countDocuments();
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    const products = await Product.find().skip(skip).limit(limit);

    res.render("product", {
      products,
      currentPage: page,
      totalPages,
      limit,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Error loading products" });
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const threeImage = req.flash("threeImage");
    const category = await Category.find();
    const brand = await Brand.find();
    const err = req.flash("err");
    res.render("addProduct", { category, brand, threeImage, err });
  } catch (error) {
    console.log(error.message);
  }
};

const insertProduct = async (req, res) => {
  // const { product_price, product_stock } = req.body;
  // const price = parseFloat(product_price);
  // const stock = parseInt(product_stock);

  try {
    if (req.files.length < 3) {
      req.flash("threeImage", "At least images be added");
      return res.redirect("/add-product");
    }

    const images = req.files.map((file) => file.filename);
    const newProduct = new Product({
      title: req.body.product_title,
      description: req.body.product_description,
      brand: req.body.product_brand,
      category: req.body.product_category,
      price: req.body.product_price,
      stock: req.body.product_stock,
      images: images,
    });

    await newProduct.save();
    res.redirect("/product");
  } catch (error) {
    console.log(error.message);
  }
};

const publishProduct = async (req, res) => {
  try {
    const id = req.params.id;
    await Product.findByIdAndUpdate(id, { isPublished: true });
    res.redirect("/product");
  } catch (error) {
    console.log(error.message);
  }
};

const unPublishProduct = async (req, res) => {
  try {
    const id = req.params.id;
    await Product.findByIdAndUpdate(id, { isPublished: false });
    res.redirect("/product");
  } catch (error) {
    console.log(error.message);
  }
};

const loadEditProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Product.findById(id)
      .populate("brand", "brand")
      .populate("category", "category");
    const category = await Category.find();
    const brand = await Brand.find();
    if (!data) {
      return res.send("not found");
    }
    const threeImage = req.flash("threeImage");
    res.render("editProduct", { data, category, brand, threeImage: "" });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyEditProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const category = await Category.find();
    const brand = await Brand.find();

    let images =
      req.files.length > 0 ? req.files.map((file) => file.filename) : undefined;

    if (images && images.length < 3) {
      const existingProduct = await Product.findById(id);

      req.flash("threeImage", "at 3 images should be uploaded");
      return res.render("editProduct", {
        data: existingProduct,
        category,
        brand,
        threeImage: req.flash("threeImage"),
      });
    }

    const updatedProduct = {
      title: req.body.product_title,
      description: req.body.product_description,
      category: req.body.product_category,
      brand: req.body.product_brand,
      stock: req.body.product_stock,
      price: req.body.product_price,
    };
    if (images) {
      updatedProduct.images = images;
    }
    await Product.findByIdAndUpdate(id, updatedProduct);
    res.redirect("/product");
  } catch (error) {
    console.log(error.message);
  }
};

const getPaginatedProducts = async (req, res) => {
  const limit = 5;
  const page = parseInt(req.query.page) || 1;

  try {
    const totalItems = await Product.countDocuments();
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    const products = await Product.find().skip(skip).limit(limit);

    res.render("product", {
      products,
      currentPage: page,
      totalPages,
      limit,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching products" });
  }
};

const loadOrder = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();

    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find()
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);

    res.render("order", {
      orders,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
};

const getPaginatedOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();

    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find().skip(skip).limit(limit);

    res.render("order", {
      orders,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
};

const loadAdminOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const orders = await Order.findById(orderId).populate("items.product");
    res.render("adminOrderDetails", { orders });
  } catch (error) {
    console.log(error.message);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, selectedStatus } = req.body;

    const order = await Order.findById(orderId).populate("items.product");
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: { status: selectedStatus },
      },
      { new: true }
    );

    if (updatedOrder) {
      res.redirect("/adminOrderDetails");
    } else {
      res.status(404).json({ success: false, message: "Order not found" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const adminOrderCancel = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const refundAmount = order.totalPrice;

    if (!refundAmount || isNaN(refundAmount) || refundAmount <= 0) {
      return res.status(400).json({ message: "Invalid refund amount" });
    }

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    order.status = "Cancelled";
    await order.save();

    let wallet = await Wallet.findOne({ userId: order.userId });

    if (!wallet) {
      wallet = new Wallet({
        userId: order.userId,
        balance: 0,
      });
      await wallet.save();
    }

    wallet.balance += refundAmount;
    await wallet.save();

    const transaction = new Transaction({
      userId: order.userId,
      amount: order.totalPrice,
      status: "Success",
      type: "Credited",
    });
    await transaction.save();

    return res.redirect("/order");
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: "An error occurred while processing the cancellation.",
    });
  }
};

const verifyReturn = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { approval } = req.body;

    if (approval === "Approved") {
      const order = await Order.findById(orderId);
      const userId = order.userId;
      const wallet = await Wallet.findOne({ userId: userId });

      for (const item of order.items) {
        const product = await Product.findById(item.product._id);

        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }

      const refundAmount = order.totalPrice;
      wallet.balance += refundAmount;
      await wallet.save();

      order.status = "Returned";
      order.returnStatus = "Approved";
      await order.save();

      const transaction = new Transaction({
        userId: userId,
        amount: order.totalPrice,
        status: "Success",
        type: "Credited",
      });
      await transaction.save();
    } else if (approval === "Rejected") {
      const order = await Order.findById(orderId);
      order.returnStatus = "Rejected";
      await order.save();
    }

    return res.redirect("/order");
  } catch (error) {
    console.log(error);
  }
};

//  ------------------------------------------------  COUPON  ------------------------------------------------

const loadCoupon = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.render("coupons", { coupons });
  } catch (error) {
    console.log(error);
  }
};

const loadAddCoupon = async (req, res) => {
  try {
    const coupExist = req.flash("coupExist");
    res.render("addCoupon", { coupExist });
  } catch (error) {
    console.log(error);
  }
};

const insertCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      description,
      discount,
      minAmount,
      maxAmount,
      expiryDate,
    } = req.body;
    const existingCoupon = await Coupon.findOne({ couponCode });

    if (existingCoupon) {
      req.flash("coupExist", "Coupon already exists");
      return res.redirect("/coupon/add-coupon");
    }

    const newCoupon = new Coupon({
      couponCode,
      description,
      discountPercentage: discount,
      maxDiscountAmount: maxAmount,
      minAmount,
      expiryDate,
    });

    await newCoupon.save();

    return res.redirect("/coupon");
  } catch (error) {
    console.log(error);
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    await Coupon.findByIdAndDelete(couponId);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false });
    console.log(error);
  }
};

//------------------------------------------  OFFER  ------------------------------------------------------

const loadOffer = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate("applicableProducts", "title")
      .populate("applicableCategories", "category");
    res.render("offer", { offers });
  } catch (error) {
    console.log(error);
  }
};

const loadAddOffer = async (req, res) => {
  try {
    const products = await Product.find({ isPublished: true });
    const categories = await Category.find({ isListed: true });
    res.render("addOffer", { products, categories });
  } catch (error) {
    console.log(error);
  }
};

const insertOffer = async (req, res) => {
  try {
    const {
      offerName,
      offerType,
      discountPercentage,
      startDate,
      endDate,
      applicableProducts,
      applicableCategories,
    } = req.body;

    const offer = new Offer({
      offerName,
      offerType,
      discountPercentage,
      startDate,
      endDate,
      applicableProducts,
      applicableCategories,
    });

    const offerAdded = await offer.save();
    const percentage = offerAdded.discountPercentage;
    if (offerAdded.offerType === "product") {
      for (const product of offerAdded.applicableProducts) {
        let productOffer = await Product.findById(product);
        if (productOffer) {
          productOffer.isDiscounted = true;
          productOffer.offerId = offerAdded._id;
          productOffer.offerPercentage = percentage;
          await productOffer.save();
        }
      }
    } else {
      for (const category of offerAdded.applicableCategories) {
        let categoryProducts = await Product.find({ category });
        for (const productOffer of categoryProducts) {
          productOffer.isDiscounted = true;
          productOffer.offerId = offerAdded._id;
          productOffer.offerPercentage = percentage;
          await productOffer.save();
        }
      }
    }

    if (offerAdded) res.redirect("/offer");
  } catch (error) {
    console.log(error);
  }
};

const listOffer = async (req, res) => {
  try {
    const id = req.params.id;
    await Offer.findByIdAndUpdate(id, { isListed: true });
    const products = await Product.find({ offerId: id });
    for (let product of products) {
      product.isDiscounted = true;
      await product.save();
    }
    res.redirect("/offer");
  } catch (error) {
    console.log(error);
  }
};

const unListOffer = async (req, res) => {
  try {
    const id = req.params.id;
    await Offer.findByIdAndUpdate(id, { isListed: false });
    const products = await Product.find({ offerId: id });
    // console.log(products)
    for (let product of products) {
      product.isDiscounted = !product.isDiscounted;
      await product.save();
    }
    res.redirect("/offer");
  } catch (error) {
    console.log(error);
  }
};

//  ================================================== SALES REPORT ================================================

const loadSalesReport = async (req, res) => {
  try {
    const { filter, startDate, endDate, page = 1 } = req.query;
    const limit = 8;
    const skip = (page - 1) * limit;

    let filterOptions = { status: "Delivered" };
    let today = dayjs().startOf("day");

    switch (filter) {
      case "daily":
        filterOptions.orderDate = {
          $gte: today.toDate(),
          $lte: today.endOf("day").toDate(),
        };
        break;

      case "weekly":
        let lastWeek = today.subtract(7, "day");
        filterOptions.orderDate = {
          $gte: lastWeek.toDate(),
          $lte: today.endOf("day").toDate(),
        };
        break;

      case "monthly":
        let lastMonth = today.subtract(1, "month");
        filterOptions.orderDate = {
          $gte: lastMonth.toDate(),
          $lte: today.endOf("day").toDate(),
        };
        break;

      case "yearly":
        let lastYear = today.subtract(1, "year");
        filterOptions.orderDate = {
          $gte: lastYear.toDate(),
          $lte: today.endOf("day").toDate(),
        };
        break;

      default:
        if (startDate && endDate) {
          filterOptions.orderDate = {
            $gte: dayjs(startDate).startOf("day").toDate(),
            $lte: dayjs(endDate).endOf("day").toDate(),
          };
        }
    }

    const totalOrders = await Order.countDocuments(filterOptions);
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find(filterOptions)
      .populate("userId", "email")
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);

    res.render("salesReport", {
      orders,
      endDate,
      startDate,
      filter,
      currentPage: parseInt(page),
      totalPages,
    });
  } catch (error) {
    console.log(error);
  }
};

//  ===========================================  BEST SELLING CATEGORY  ===========================================

const loadBestCategory = async (req, res) => {
  try {
    const topCategories = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      {
        $sort: { totalQuantity: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          _id: "$category._id",
          category: "$category.category",
          totalQuantity: 1,
        },
      },
    ]);
    // console.log(topCategories);
    res.render("bestCategory", { topCategories });
  } catch (error) {
    console.log(error);
  }
};

const loadBestProduct = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: "$product._id",
          productTitle: "$product.title",
          totalQuantity: 1,
        },
      },
    ]);
    res.render("bestProduct", { topProducts });
  } catch (error) {
    console.log(error);
  }
};

const loadBestBrand = async (req, res) => {
  try {
    const topBrands = await Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.brand",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "brands",
          localField: "_id",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: "$brand" },
      {
        $project: {
          _id: "$brand._id",
          brandName: "$brand.brand",
          totalQuantity: 1,
        },
      },
    ]);
    res.render("bestBrand", { topBrands });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadAdminLogin,
  verifyAdminLogin,
  loadCustomer,
  blockUser,
  unBlockUser,
  loadCategory,
  loadAddCategory,
  insertCategory,
  listCategory,
  unListCategory,
  loadEditCategory,
  verifyEditCategory,
  loadBrand,
  loadAddBrand,
  insertBrand,
  loadEditBrand,
  verifyEditBrand,
  listBrand,
  unListBrand,
  adminLogout,
  loadProduct,
  loadAddProduct,
  upload,
  insertProduct,
  publishProduct,
  unPublishProduct,
  loadEditProduct,
  verifyEditProduct,
  loadOrder,
  loadAdminOrderDetails,
  updateStatus,
  adminOrderCancel,
  loadCoupon,
  loadAddCoupon,
  insertCoupon,
  deleteCoupon,
  getPaginatedProducts,
  getPaginatedOrders,
  getPaginatedUsers,
  loadOffer,
  loadAddOffer,
  insertOffer,
  listOffer,
  unListOffer,
  loadSalesReport,
  loadBestCategory,
  loadBestBrand,
  loadBestProduct,
  verifyReturn,
};
