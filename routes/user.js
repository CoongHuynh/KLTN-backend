const express = require("express");
const {
  register,
  activateAccount,
  login,
  sendVerification,
  sendCodeResetPassword,
  verifyCodeResetPassword,
  deleteUser,
  requestNewToken,
  createUser,
  getAllUsers,
  getUserById,
  forgotPassword,
  resetPassword,
  updateProfile,
} = require("../controllers/userControllers");
const {
  getRecommendations,
  increaseProductScore,
  calculateScoreIncrease,
  getRecommenProduct,
  getRecommenProductForUser,
} = require("../controllers/recommendationController");

const router = express.Router();
const { authentication } = require("../middleware/authenUser");

router.get("/users", authentication, getAllUsers);
router.get("/users/:id", authentication, getUserById);
router.post("/register", register);
router.post("/activate", authentication, activateAccount);
router.post("/login", login);
router.post("/authen", authentication);
router.post("/sendVerification", authentication, sendVerification);
router.post("/sendCodeResetPassword", sendCodeResetPassword);
router.post("/verifyCodeResetPassword", verifyCodeResetPassword);
router.post("/users", authentication, createUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.delete("/users/:id", authentication, deleteUser);
router.put("/update-profile", authentication, updateProfile);

router.get("/recommenproduct", getRecommenProduct);
router.get("/recommenuser", authentication, getRecommenProductForUser);
router.get("/recommendations", getRecommendations);
router.post("/increase-score", authentication, increaseProductScore);
router.post(
  "/calculate-score-increase",
  authentication,
  calculateScoreIncrease
);

module.exports = router;
