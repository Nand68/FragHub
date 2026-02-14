const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");

// All profile routes are protected
router.get("/", authMiddleware, profileController.getProfile);
router.post("/", authMiddleware, profileController.createProfile);
router.put("/", authMiddleware, profileController.updateProfile);

module.exports = router;
