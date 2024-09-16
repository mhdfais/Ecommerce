const loadAdminLogin = async (req, res) => {
  try {
    const fail = req.flash("fail");
    res.render("adminLogin", { fail });
  } catch (error) {
    console.log(error.message);
  }
};

const email = "admin@gmail.com";
const pswd = "54321";

const verifyAdminLogin = async (req, res) => {
  try {
    if (req.body.email === email && req.body.pswd === pswd) {
      res.redirect("/adminHome");
    } else {
      req.flash("fail", "invalid credential");
      res.redirect("/adminLogin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadAdminHome = async (req, res) => {
  try {
    res.render("adminHome");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadAdminLogin,
  verifyAdminLogin,
  loadAdminHome,
};
