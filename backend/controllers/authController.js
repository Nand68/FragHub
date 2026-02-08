const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateTokens");
const { sendEmail } = require("../utils/sendEmail");


// Generate 6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


// ================= SIGNUP =================
exports.signup = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (await User.findOne({ email }))
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.create({
      email,
      password: hashedPassword,
      otp: hashedOTP,
      otpExpires: Date.now() + 10 * 60 * 1000,
    });

    await sendEmail(email, "Verify Email", `Your OTP is ${otp}`);

    res.status(201).json({ message: "Signup successful. OTP sent." });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= VERIFY OTP =================
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    if (user.otp !== hashedOTP || user.otpExpires < Date.now())
      return res.status(400).json({ message: "Invalid or expired OTP" });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({ message: "Email verified successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= LOGIN =================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.isVerified)
      return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefresh;
    await user.save();

    res.json({ accessToken, refreshToken });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= REFRESH TOKEN =================
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshToken)
      return res.status(401).json({ message: "Unauthorized" });

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid token" });

    const newAccessToken = generateAccessToken(user._id);

    res.json({ accessToken: newAccessToken });

  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};


// ================= LOGOUT =================
exports.logout = async (req, res) => {
  const { userId } = req.body;

  await User.findByIdAndUpdate(userId, { refreshToken: null });

  res.json({ message: "Logged out successfully" });
};
