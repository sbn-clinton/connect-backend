import express from "express";
import { Job, Application } from "../models/schema.js";
import { employeerAuthMiddleware } from "../middleware/auth.js";


const router = express.Router();

// Get all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find()
  .sort({ createdAt: -1 })
  .populate("postedBy", "email")
  .populate("applications", "user")

    res.status(200).json(jobs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/my-job", employeerAuthMiddleware, async (req, res) => {
  const userId = req.user._id;
  try {
    const jobs = await Job.find({ postedBy: userId}).sort({ createdAt: -1 })
    res.status(200).json(jobs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Post a new job
router.post("/", employeerAuthMiddleware,   async (req, res) => {
  
  const { title, company, description, location, requirements, benefits, jobType, employmentMode, responsibilities, status,  } = req.body;

  try {
    const newJob = await Job.create({ title, company, description, location, requirements, benefits, jobType, employmentMode, responsibilities, status, postedBy: req.user._id });
    res.status(201).json({ message: "Job posted successfully", job: newJob });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
 
});

router.get("/:id", async (req, res) => {
  
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id })
  .populate("postedBy", "email") // Job owner
  .populate({
    path: "applications",
    populate: {
      path: "user",
      select: "fullName email", // what fields to return for the applicant
    },
  });

  res.json(job)

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", employeerAuthMiddleware,  async (req, res) => {

  

  const { title, company, description, location, requirements, benefits, jobType, employmentMode, responsibilities, status,  } = req.body;

  try {
    const updatedJob = await Job.findOneAndUpdate( {_id: req.params.id, postedBy: req.user._id }, { title, company, description, location, requirements, benefits, jobType, employmentMode, responsibilities, status, });
    res.status(201).json({ message: "Job updated successfully", job: updatedJob });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", employeerAuthMiddleware, async (req, res) => {
  try {

    const deletedJob = await Job.findOneAndDelete({
      _id: req.params.id,
      postedBy: req.user._id
    });
    
    if (deletedJob) {
      await Application.deleteMany({ job: deletedJob._id });
    }
    
     res.json({ message: "Job deleted successfully", deletedJob });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});





export default router;
