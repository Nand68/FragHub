const UserProfile = require("../models/UserProfile");

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user;

        const profile = await UserProfile.findOne({ userId });

        if (!profile) {
            return res.status(200).json({
                success: true,
                exists: false,
                message: "No profile found",
                data: null,
            });
        }

        res.status(200).json({
            success: true,
            exists: true,
            data: profile,
        });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
            error: error.message,
        });
    }
};

// Create user profile
exports.createProfile = async (req, res) => {
    try {
        const userId = req.user;

        // Check if profile already exists
        const existingProfile = await UserProfile.findOne({ userId });
        if (existingProfile) {
            return res.status(400).json({
                success: false,
                message: "Profile already exists. Use update endpoint instead.",
            });
        }

        // Create new profile
        const profileData = {
            userId,
            ...req.body,
        };

        const profile = await UserProfile.create(profileData);

        res.status(201).json({
            success: true,
            message: "Profile created successfully",
            data: profile,
        });
    } catch (error) {
        console.error("Create profile error:", error);

        // Handle validation errors
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create profile",
            error: error.message,
        });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user;

        // Find and update profile
        const profile = await UserProfile.findOneAndUpdate(
            { userId },
            { ...req.body },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found. Create one first.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: profile,
        });
    } catch (error) {
        console.error("Update profile error:", error);

        // Handle validation errors
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: error.message,
        });
    }
};
