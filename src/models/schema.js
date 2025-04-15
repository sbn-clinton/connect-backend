import mongoose from "mongoose";
import { countries } from "countries-list";

// Extract country names dynamically
const countryNames = Object.values(countries).map(country => country.name);


const ApplicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Applicant
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true }, // Job being applied for

    resume: {
      name: {
        type: String,
        required: true,
      },
      mimetype: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      data: {
        type: Buffer,
        required: true,
      },
    }, // Resume file URL
    // coverLetter: { type: String }, // Optional cover letter

    status: {
      type: String,
      enum: ["pending","approved", "rejected"],
      default: "pending",
    },

    appliedAt: { type: Date, default: Date.now }, // Application timestamp
  }
);

export const Application = mongoose.model("Application", ApplicationSchema);


const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, enum: countryNames },

    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance"],
      required: true,
    },

    employmentMode: {
      type: String,
      enum: ["Remote", "On-site", "Hybrid"],
      required: true,
    },

    description: { type: String, required: true },
    responsibilities: { type: [String], required: true },
    requirements: { type: [String], required: true },
    benefits: { type: [String] },


    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    applications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }],

    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
    },

  },
  { timestamps: true }
);

export const Job = mongoose.model("Job", JobSchema);




const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, unique: true, sparse: true }, // Optional phone number
    profilePicture: { 
      fileName: String,
      fileType: String,
      fileSize: String,
      fileData: Buffer,
    }, // URL of the user's profile picture
    bio: { type: String, maxlength: 500 }, // Short bio about the user
    location: { type: String, enum: countryNames }, // User's country of residence

    qualifications: {
      type: [String],
      enum: [
        "Bachelor's degree",
        "Master's degree",
        "Doctorate degree",
        "Professional Certificate",
        "Diploma",
        "Associate degree",
        "Secondary education",
        "High school",
        "Undergraduate",
        "Graduate",
        "Other",
      ],
    },

    skills: {
      type: [String],
      enum: [
        "Frontend Developer",
        "Backend Developer",
        "Fullstack Developer",
        "UI/UX Designer",
        "Mobile Developer",
        "DevOps",
        "Database Administrator",
        "System Administrator",
        "QA Engineer",
        "Architect",
        "Software Engineer",
        "Project Manager",
        "Technical Writer",
        "Content Writer",
        "Marketing Specialist",
        "SEO Specialist",
        "Social Media Specialist",
        "Community Manager",
        "Business Analyst",
        "Product Manager",
        "Sales Associate",
        "Customer Support Specialist",
        "IT Manager",
        "HR Specialist",
        "Accountant",
        "Finance Specialist",
        "Legal Specialist",
        "Human Resources Specialist",
        "Recruiter",
        "Consultant",
        "Other",
      ],
    },

    experience: [
      {
        jobTitle: { type: String,  },
        company: { type: String,  },
        location: { type: String },
        startDate: { type: Date,  },
        endDate: { type: Date }, // Null if currently working
        description: { type: String, maxlength: 1000 },
      },
    ],

    socialLinks: {
      linkedIn: { type: String },
      github: { type: String },
      portfolio: { type: String },
    },

    role: {
      type: String,
      enum: ["employer", "jobseeker", "admin"],
      default: "jobseeker",
    },

    notifications: [
      {
        message: { type: String, required: true },
        type: { type: String, enum: ["job", "system", "message"], default: "system" },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);


const FileSchema = new mongoose.Schema({
  name: String,
  mimetype: String,
  size: Number,
  data: Buffer
});

export const FileModel = mongoose.model('File', FileSchema);