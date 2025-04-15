import express from "express";
import { Application } from "../models/schema.js";
import {Job, User } from "../models/schema.js";
import { employeerAuthMiddleware } from "../middleware/auth.js"; // Authentication middleware
import { jobSeekerAuthMiddleware } from "../middleware/auth.js";

import { upload } from "../config/pdfUpload.js";
import nodemailer from "nodemailer"; 
import dotenv from "dotenv";

dotenv.config();


const router = express.Router();


// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or use SMTP details: host, port, etc.
  auth: {
    user: process.env.EMAIL_USER, // Use environment variables for security
    pass: process.env.EMAIL_PASSWORD
  }
});

// Create an email sending function
const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html: html || text // Use HTML if provided, otherwise use text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};



router.post("/:jobId/apply",  jobSeekerAuthMiddleware, upload.single('file'),  async (req, res) => {

  const userId = req.user.id; // Extracted from authentication middleware
  const jobId = req.params.jobId;

  try {
    // Check if the job exists
    const job = await Job.findById(jobId).populate("postedBy")
    if (!job) return res.status(404).json({ error: "Job not found" });

    // Check if the user has already applied
    const existingApplication = await Application.findOne({ user: userId, job: jobId });
    if (existingApplication) return res.status(400).json({ error: "You have already applied for this job." });

    // Create new application
    const application = await Application.create({ user: userId, job: jobId, resume: {
      name: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer,
    } });

    // Update the job document by pushing the application ID into the `applications` array
    job.applications.push(application._id);
    await job.save();

    await User.findByIdAndUpdate(job.postedBy, {
      $push: {
        notifications: {
          message: `A new application has been submitted for the job ${job.title}`,
          createdAt: new Date(),
          type: "Job Application",
          jobId: job._id,
        }
      }
    })

    res.status(201).json({ message: "Application submitted successfully!", application });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});




// Get all applications for a logged-in user
router.get("/my-applications", jobSeekerAuthMiddleware , async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user.id }).sort({ appliedAt: -1 }).populate("job");
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


// Update the approval route
router.put("/:id/approve", async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("user")
      .populate("job");

    if (!application) return res.status(404).json({ error: "Application not found" });

    application.status = "approved";
    await application.save();

    // Save in-app notification
    await User.findByIdAndUpdate(application.user._id, {
      $push: {
        notifications: {
          message: `Your application for "${application.job.title}" has been approved!`,
          createdAt: new Date()
        },
      },
    });

    // Send an email notification
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4a5568;">Application Approved!</h1>
        </div>
        <p style="margin-bottom: 15px;">Hello ${application.user.name},</p>
        <p style="margin-bottom: 15px;">We're pleased to inform you that your application for <strong>${application.job.title}</strong> at <strong>${application.job.company}</strong> has been approved!</p>
        <p style="margin-bottom: 15px;">The employer will be contacting you soon with next steps. Please make sure your contact information is up to date in your profile.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Job:</strong> ${application.job.title}</p>
          <p style="margin: 5px 0;"><strong>Company:</strong> ${application.job.company}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${application.job.location}</p>
        </div>
        <p style="margin-bottom: 15px;">Thank you for using Connect! If you have any questions, please don't hesitate to contact our support team.</p>
        <p style="margin-bottom: 5px;">Best regards,</p>
        <p style="margin-top: 0;"><strong>The Connect Team</strong></p>
      </div>
    `;

    await sendEmail(
      application.user.email,
      "Good News! Your Job Application Has Been Approved",
      `Congratulations ${application.user.name}, your application for "${application.job.title}" has been approved!`,
      emailHtml
    );

    res.status(200).json({ message: "Application approved, email sent, and notification saved!" });
  } catch (error) {
    console.error("Error in approval process:", error);
    res.status(500).json({ error: "Failed to approve application" });
  }
});

// Add a rejection route
router.put("/:id/reject", async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("user")
      .populate("job");

    if (!application) return res.status(404).json({ error: "Application not found" });

    application.status = "rejected";
    await application.save();

    // Save in-app notification
    await User.findByIdAndUpdate(application.user._id, {
      $push: {
        notifications: {
          message: `Your application for "${application.job.title}" was not selected to move forward.`,
          createdAt: new Date()
        },
      },
    });

    // Send an email notification
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4a5568;">Application Update</h1>
        </div>
        <p style="margin-bottom: 15px;">Hello ${application.user.name},</p>
        <p style="margin-bottom: 15px;">Thank you for your interest in the <strong>${application.job.title}</strong> position at <strong>${application.job.company}</strong>.</p>
        <p style="margin-bottom: 15px;">After careful consideration, the employer has decided to pursue other candidates whose qualifications more closely match their current needs.</p>
        <p style="margin-bottom: 15px;">We encourage you to continue exploring other opportunities on Connect that match your skills and experience.</p>
        <div style="margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL}/jobs" style="background-color: #3182ce; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">Browse More Jobs</a>
        </div>
        <p style="margin-bottom: 15px;">Don't be discouraged! Finding the right position takes time, and we're here to help you throughout your job search journey.</p>
        <p style="margin-bottom: 5px;">Best regards,</p>
        <p style="margin-top: 0;"><strong>The Connect Team</strong></p>
      </div>
    `;

    await sendEmail(
      application.user.email,
      "Update on Your Job Application",
      `Thank you for your interest in "${application.job.title}". After careful consideration, the employer has decided to pursue other candidates at this time.`,
      emailHtml
    );

    res.json({ message: "Application rejected, email sent, and notification saved!" });
  } catch (error) {
    console.error("Error in rejection process:", error);
    res.status(500).json({ error: "Failed to reject application" });
  }
});

router.delete("/:id", jobSeekerAuthMiddleware, async (req, res) => {
  
  const { id } = req.params;
  try {
    const application = await Application.findOne({ _id: id, user: req.user.id }).populate("job").populate("user");
    if (!application) return res.status(404).json({ error: "Application not found" });
    await Application.findOneAndDelete({
      _id: id
      });

      await User.findByIdAndUpdate(application.job.postedBy, {
        $push: {
          notifications: {
            message: `Applicaton for ${application.job.title} by ${application.user.fullName} has been deleted.`,
            createdAt: new Date()
          },
        },  
      }); 
    res.status(200).json({ message: "Application deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({ error: "Failed to delete application" });
  }
});

export default router;