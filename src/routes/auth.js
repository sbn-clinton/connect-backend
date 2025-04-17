import express from "express";
import passport from "passport";
import { User } from "../models/schema.js";
import { hashPassword } from "../utils/helpers.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { fullName, email, password, role, phoneNumber,  bio, location, qualifications, skills, experience,  socialLinks } = req.body;
  const hashedPassword = hashPassword(password);

  try {
    const newUser = await User.create({ fullName, email, password: hashedPassword, role, phoneNumber, bio, location, qualifications, skills, experience,  socialLinks });
    res.status(201).json({ message: "User registered successfully", status: 201 });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Could not register user", status: 400 , message: err.message });
    
  }
});


router.post('/login', 
  passport.authenticate('local'),
  function(req, res) {
    const newUser = {
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      phoneNumber: req.user.phoneNumber,
      bio: req.user.bio,
      location: req.user.location,
      qualifications: req.user.qualifications,
      skills: req.user.skills,
      experience: req.user.experience,
      socialLinks: req.user.socialLinks,
      profilePicture: req.user.profilePicture,
      notifications: req.user.notifications,
      jobs: req.user.jobs,
      applications: req.user.applications,
    };
    
    res.status(201).json({ message: "Logged in successfully",  user: newUser });
  })


router.get("/status", async (req, res) => {
  if (req.isAuthenticated()) {
    if (!req.user) {
      return res.status(500).json({ message: "User session not found" });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(500).json({ message: "User not found" });
    }     

    return res.json({
      message: "User is logged in",
      status: 200,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        qualifications: user.qualifications,
        skills: user.skills,
        experience: user.experience,
        socialLinks: user.socialLinks,
        bio: user.bio,
        location: user.location,
        phoneNumber: user.phoneNumber,
        notifications: user.notifications,
        jobs: user.jobs,
        applications: user.applications,
      },
    });
  } else {
    return res.status(401).json({ message: "User is not logged in", status: 401 });
  }
});


// Logout
router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }else {
    req.session.destroy();
    }
  });
  res.status(200).json({ message: "Logged out" });
});

export default router;
