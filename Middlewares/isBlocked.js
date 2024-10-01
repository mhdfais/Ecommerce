const User = require("../Models/userModel");

const checkBlocked = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (user && user.isBlocked) {
      return res.redirect("/login");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = checkBlocked;
