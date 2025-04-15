import express from "express";
import { User, Job } from "../models/schema.js";
import { authMiddleware, employeerAuthMiddleware } from "../middleware/auth.js";
import {imageUpload} from "../config/pictureUpload.js";

const router = express.Router();

router.get("/:id/jobs", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user.jobs);
});



router.put("/:id/notifications/markAsRead", async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, {
    $set: { "notifications.$[].read": true },
  });
  res.json({ message: "Notifications marked as read" });
});


router.get('/my-jobs', employeerAuthMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id }).populate({
      path: "applications",
      populate: { path: "user", populate: { path: "email" } }
    })
    res.status(200).json(jobs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update the profile picture upload route
router.put("/profile-picture", imageUpload.single('file'), authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  user.profilePicture = { 
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    fileData: req.file.buffer, // Make sure this matches what you access in the get route
  };
  await user.save();
  res.json({ message: "Profile picture updated successfully", data: user.profilePicture })
});

router.put("/update-profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
  user.fullName = req.body.fullName;
  user.email = req.body.email;
  user.phoneNumber = req.body.phoneNumber;
  user.role = req.body.role;
  user.bio = req.body.bio;
  user.skills = req.body.skills;
  user.qualifications = req.body.qualifications;
  user.socialLinks = req.body.socialLinks;
  await user.save();
  res.status(200).json({ message: "Profile updated successfully", data: user });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}); 

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("jobs").populate("applications");
    console.log(user);
  res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;