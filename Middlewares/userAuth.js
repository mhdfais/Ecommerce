const User = require("../Models/userModel");

const isUser = (req, res, next) => {
  if (req.session.user || req.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

// const isUser = async (req, res, next) => {
//   try {
//     const userId = req.session.user._id;
//     const user = await User.findById(userId);

//     console.log(user,userId)

//     if (!user || user.isBlocked) {
//       return res.redirect("/login");
//     }

//     next();
//   } catch (error) {
//     console.log(error);
//   }
// };

module.exports = isUser;
