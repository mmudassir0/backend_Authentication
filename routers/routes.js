const express = require("express");
const router = express.Router();
const userController = require("../controller/usercontroller");
const authController = require("../controller/authController");
router.route("/").get(userController.protect, userController.getAllUser);

router.route("/:id").delete(
  userController.protect,
  userController.restrictTo("admin", "lead-guide"), //admin and lead-guide can only delete user
  userController.deleteUser
);

router.route("/signup").post(authController.signup);
router.route("/login").post(authController.login);

router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/resetPassword/:token").patch(authController.resetPassword);
router
  .route("/updatemypassword")
  .patch(userController.protect, authController.updatePassword);
router
  .route("/updateme")
  .patch(userController.protect, userController.updateMe);

router
  .route("/deleteme")
  .patch(userController.protect, userController.deleteMe);

// ----------------------------form data---------------------------------------------
router.route("/data").post(userController.formData);
module.exports = router;
