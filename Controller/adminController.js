const User = require("../Models/userModel");
const Category = require("../Models/category");
const Brand = require("../Models/brand");
const Product = require("../Models/product");
const multer = require("multer");

// -------------------------------------------  multer  ------------------------------------------------------

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
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
    const user = await User.find({ isVerified: true });
    res.render("customer", { user });
  } catch (error) {
    console.log(error.message);
  }
};

// -------------------------------------------------  DASHBOARD  --------------------------------------------

const loadDashboard = async (req, res) => {
  try {
    res.render("dashboard");
  } catch (error) {
    console.log(error.message);
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
  try {
    const data = await Product.find();
    res.render("product", { data });
  } catch (error) {
    console.log(error.message);
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
  const { product_price, product_stock } = req.body;
  const price = parseFloat(product_price);
  const stock = parseInt(product_stock);
  // if (!isNaN(price) || price <= 0 || isNaN(stock) || stock < 0) {
  //   req.flash("err", "price must be positive and stock be 0 or more");
  //   return res.redirect("/add-product");
  // }
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

module.exports = {
  loadAdminLogin,
  verifyAdminLogin,
  loadDashboard,
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
};
