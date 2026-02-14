const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Public Routes
router.post("/signup", auth.signup);
router.post("/verify-otp", auth.verifyOTP);
router.post("/login", auth.login);
router.post("/refresh-token", auth.refreshToken);
router.post("/logout", auth.logout);
router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);
router.post("/resend-otp", auth.resendOTP);

// Protected Route Example
router.get("/profile", authMiddleware, async (req, res) => {
  res.json({
    message: "Protected data",
    userId: req.user,
  });
});

module.exports = router;
