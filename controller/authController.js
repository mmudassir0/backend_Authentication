`node --trace-warnings ...`;
const jwt = require("jsonwebtoken");
const user = require("../model/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../util/email");
const { param } = require("../routers/routes");

// ------------------------create jwt token----------------------------------
const createAndSendToken = (user, statuscode, res) => {
  const token = signToken(user._id);
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRE_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true, this is only for production mode not development mode here we have only hhtp not https
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOption.secure = true;
  // remove password for output
  res.cookie("jwt", token, cookieOption);
  // user.password = undefined;
  res.status(statuscode).json({
    status: "success",
    token,
    data: { user },
  });
};

// ---------------------------------signup-----------------------------------------
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

exports.signup = async (req, res, next) => {
  const { email } = req.body;
  try {
    // Check if user already exists
    let myuser = await user.findOne({ email });
    if (myuser) {
      return res.status(400).json({ errors: [{ msg: "User already exists" }] });
    }

    const newUser = user({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      role: req.body.role,
    });
    newUser.save();
    createAndSendToken(newUser, 201, res);
    // const token = signToken(newUser._id);
    // res.status(201).json({
    //   status: "success",
    //   token,
    //   data: { user: newUser },
    // });
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
// ---------------------------------login-----------------------------------------
exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  //1) check if user and password exist
  if (!email || !password) {
    return res.send({ message: "please provide email and password" });
  }
  //2) check if user exit and password are same
  const myuser = await user.findOne({ email }).select("+password");
  const correct = await bcrypt.compare(password, myuser.password);

  if (!myuser || !correct) {
    return res.send({ message: "please provide valid email or password" });
  }
  //   console.log(myuser);

  //3)if ok send token to client
  createAndSendToken(myuser, 200, res);

  //   const token = signToken(myuser._id);

  //   res.status(200).json({
  //     status: "success",
  //     token,
  //   });
};

// -------------------------- forget password---------------------
exports.forgotPassword = async (req, res, next) => {
  // 1:get user based on email
  const userEmail = await user.findOne({ email: req.body.email });
  if (!userEmail) {
    return res.status(404).json({
      status: "not found",
      message: `there is no user with this email: ${userEmail}`,
    });
  }
  // 2:generate randon reset token
  // this is encrypted token and we save it schema
  //   const resetToken = crypto.randomBytes(32).toString("hex");
  //   const passwordResetToken = crypto
  //     .createHash("sha256")
  //     .update(resetToken)
  //     .digest("hex");
  //   console.log({ resetToken }, this.passwordResetToken);

  //   const passwordExpiary = Date.now() + 10 * 60 * 1000; //it's 10 min in mili sec
  //   console.log(resetToken);
  const resetToken = userEmail.createPasswordResetToken();
  await userEmail.save({ validateBeforeSave: false });
  // 3:send this token to email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/resetPassword/${resetToken}`;
  const message = `if you forget your password send a patch request with your new password and 
  confirm password to ${resetURL} \n if you didn't forget password than ignore this email`;
  try {
    await sendEmail({
      email: userEmail.email,
      subject: "your request token will expire in 10 min",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "token sent to your email",
    });
  } catch (err) {
    userEmail.passwordResetToken = undefined;
    userEmail.passwordExpiry = undefined;
    await userEmail.save({ validateBeforeSave: false });
    return res.status(500).json({
      status: "internal server erroe",
      message: "there was an error sending email. please try again",
    });
  }
};
// --------------------------reset password---------------------
exports.resetPassword = async (req, res, next) => {
  // 1:get user based on token
  const hashToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const userToken = await user.findOne({
    passwordResetToken: hashToken,
    passwordExpiry: { $gt: Date.now() },
  });
  // 2:if token not expire and there is user set new password
  if (!userToken) {
    return res.status(400).json({
      status: "bad request",
      message: "Token is invalid or expired",
    });
  }
  userToken.password = req.body.password;
  userToken.passwordConfirm = req.body.passwordConfirm;
  userToken.passwordResetToken = undefined;
  userToken.passwordExpiry = undefined;
  await userToken.save();

  // 3:update changepasswordAt property for user

  // 4:log the user in send jwt
  createAndSendToken(userToken, 200, res);

  // const token = signToken(userToken._id);
  // res.status(200).json({
  //   status: "success",
  //   token,
  // });
};
// --------------------------update current user password----------------------------
exports.updatePassword = async (req, res, next) => {
  // 1:get user from collection
  const currentUser = await user.findById(req.user.id).select("+password");
  console.log(currentUser, ":currentUSer");
  // 2:check if posted current password is correct
  const correctPassword = await bcrypt.compare(
    req.body.passwordCurrent,
    currentUser.password
  );
  if (!correctPassword) {
    res.status(401).json({
      status: "unauthorize",
      message: "you have entered incorrect password. plaese try again",
    });
  }
  // 3:if password is correct then update password
  currentUser.password = req.body.password;
  currentUser.passwordConfirm = req.body.passwordConfirm;
  await currentUser.save();
  // 4:log the user in ,send JWT
  createAndSendToken(currentUser, 200, res);
};
