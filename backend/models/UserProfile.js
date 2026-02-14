const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        // Basic Information
        age: {
            type: Number,
            required: [true, 'Age is required'],
            min: 13,
            max: 100,
        },
        gender: {
            type: String,
            required: [true, 'Gender is required'],
            enum: ["Male", "Female", "Other", "Prefer not to say"],
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
        },

        // Game Information
        pubgUID: {
            type: String,
            required: [true, 'PUBG UID is required'],
            validate: {
                validator: function (v) {
                    return /^\d{11}$/.test(v);
                },
                message: 'PUBG UID must be exactly 11 digits'
            },
        },
        primaryRole: {
            type: String,
            required: [true, 'Primary Role is required'],
            enum: ["IGL", "Assaulter", "Support", "Sniper", "Entry Fragger"],
        },
        secondaryRole: {
            type: String,
            enum: ["IGL", "Assaulter", "Support", "Sniper", "Entry Fragger", "None"],
        },

        // Experience
        experience: [{
            type: String,
            enum: [
                "Tier 1 Scrims",
                "Tier 2 Scrims",
                "Tier 3 Scrims",
                "BGIS",
                "PMCO",
                "Skyesports Championship",
                "ESL Snapdragon",
                "Red Bull MEO",
                "Nodwin Invitational",
                "BMPS",
                "Local LAN Events",
                "Other"
            ]
        }],
        experienceOther: {
            type: String,
        },
        yearsOfExperience: {
            type: Number,
            min: 0,
            max: 20,
        },

        // Performance
        achievements: {
            type: String,
        },
        previousOrganization: {
            type: String,
        },

        // Game Stats
        deviceType: {
            type: String,
            required: [true, 'Device Type is required'],
            enum: ["Mobile", "iPad", "PC"],
        },
        fingerSetup: {
            type: String,
            required: [true, 'Finger Setup is required'],
            enum: ["Thumb", "3 Finger", "4 Finger", "5 Finger"],
        },
        gyroscope: {
            type: Boolean,
            required: [true, 'Gyroscope preference is required'],
        },
        kdRatio: {
            type: Number,
            required: [true, 'K/D Ratio is required'],
            min: 0,
        },
        averageDamage: {
            type: Number,
            required: [true, 'Average Damage is required'],
            min: 0,
        },

        // Preferences
        preferredMaps: {
            type: [{
                type: String,
                enum: ["Erangel", "Miramar", "Sanhok", "Livik", "Rondo"]
            }],
            validate: {
                validator: function (v) {
                    return v && v.length > 0;
                },
                message: 'At least one preferred map is required'
            },
        },
        playstyle: {
            type: String,
            required: [true, 'Playstyle is required'],
            enum: ["Aggressive", "Passive", "Balanced"],
        },

        // Social Links
        socialLinks: {
            instagram: String,
            twitter: String,
            youtube: String,
        },

        // Additional
        banHistory: {
            type: Boolean,
            required: [true, 'Ban History is required'],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("UserProfile", userProfileSchema);
