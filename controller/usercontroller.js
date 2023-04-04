const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const data = require("../model/data");
const user = require("../model/user");

// -----------------------------get all users--------------------------------------------------
exports.getAllUser = async (req, res) => {
  const myuser = await user.find();
  res.status(200).json({
    status: "success",
    data: {
      myuser,
    },
  });
};
// ----------------------------delete user------------------------------------
// ---------------auth middle ware only login user can see data----------------------
exports.protect = async (req, res, next) => {
  // 1:get token check if it exist there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // console.log(token, "token");
  if (!token) {
    return res.status(401).json({
      status: "fail",
      message: "you are not logged In to get access. please login",
    });
  }
  // 2:validate/ verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);
  // 3:check if user exist
  const freshUser = await user.findById(decoded.id);
  console.log(freshUser);
  if (!freshUser) {
    return res.status(401).json({
      status: "fail",
      message: "user belong to this token no longer exist",
    });
  }
  // 4:check if user change password after token issue
  req.user = freshUser;
  next();
};
// ----------------------------restrictTo--------------------------------------
// protect auth delete
exports.restrictTo = (...roles) => {
  return async (req, res, next) => {
    const id = req.params.id;
    const userdata = await user.findById(id);
    if (!roles.includes(userdata.role)) {
      return res.status(403).json({
        status: "forbidden",
        message:
          "you don't have permission to delete users, contact to your administrator ",
      });
    }
    next();
  };
};
// ---------------------------------deleteUser----------------------------------------
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    await user.findByIdAndDelete(id);
    res.status(200).send({ message: "Document deleted successfully." });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ error: "An error occurred while deleting the document." });
  }
};
exports.formData = async (req, res) => {
  const userData = data(req.body);
  userData.save();
  res.status(200).json({
    status: "success",
    data: {
      userData,
    },
  });
};
// -----------------------------update only login user data-----------------------------
const filterObj = (obj, ...allawedField) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allawedField.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.updateMe = async (req, res, next) => {
  // 1:create error if post password update
  if (req.body.password || req.body.passwordConfirm) {
    res.status(400).json({
      status: "bad request",
      message: "this route is not for update password only update data",
    });
  }
  // 2:filtered out field that are not allow to update
  const filteredBody = filterObj(req.body, "name", "email");
  // 3:update user data/document
  const updatedUser = await user.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
};
// ---------------------------delete current user-------------------------------
exports.deleteMe = async (req, res, next) => {
  const deletedUser = await user.findByIdAndUpdate(req.user.id, {
    active: false,
  });
  res.status(204).json({
    status: "success",
    message: `successfully deleted ${deletedUser.name}`,
  });
};
