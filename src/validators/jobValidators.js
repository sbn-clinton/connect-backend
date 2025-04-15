import { body } from "express-validator";
import { countries } from "countries-list";

// Extract country names dynamically
const countryNames = Object.values(countries).map(country => country.name);

export const jobValidator = [
  body("title")
  .string()
    .trim()
    .notEmpty().withMessage("Job title is required"),

  body("company")
    .string()
    .trim()
    .notEmpty().withMessage("Company name is required"),

  body("location")
    
    .isIn(countryNames).withMessage("Invalid country selected"),

  body("jobType")
    .notEmpty().withMessage("Job type is required")
    .isIn(["Full-time", "Part-time", "Contract", "Internship", "Freelance"])
    .withMessage("Invalid job type"),

  body("employmentMode")
    .notEmpty().withMessage("Employment mode is required")
    .isIn(["Remote", "On-site", "Hybrid"])
    .withMessage("Invalid employment mode"),

  body("description")
    .notEmpty().withMessage("Job description is required"),

  body("responsibilities")
    .isArray({ min: 1 }).withMessage("Responsibilities must be a non-empty array of strings")
    .custom((arr) => arr.every(item => typeof item === "string"))
    .withMessage("Each responsibility must be a string"),

  body("requirements")
    .isArray({ min: 1 }).withMessage("Requirements must be a non-empty array of strings")
    .custom((arr) => arr.every(item => typeof item === "string"))
    .withMessage("Each requirement must be a string"),

  body("benefits")
    .optional()
    .isArray().withMessage("Benefits must be an array of strings")
    .custom((arr) => arr.every(item => typeof item === "string"))
    .withMessage("Each benefit must be a string"),

  body("postedBy")
    .notEmpty().withMessage("postedBy is required")
    .isMongoId().withMessage("Invalid user ID format"),

  body("status")
    .optional()
    .isIn(["Open", "Closed"]).withMessage("Status must be 'Open' or 'Closed'")
];


// Application Validation Middleware
export const applicationValidator = [
  body("job")
    .notEmpty()
    .withMessage("Job ID is required")
    .isMongoId()
    .withMessage("Job ID must be a valid MongoDB ObjectId"),

  // Multer handles resume validation (existence), so we validate structure manually if needed
  body("resume.name")
    .notEmpty()
    .withMessage("Resume name is required"),
  body("resume.mimetype")
    .notEmpty()
    .withMessage("Resume mimetype is required")
    .isIn(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"])
    .withMessage("Resume must be a PDF or Word document"),
  body("resume.size")
    .notEmpty()
    .withMessage("Resume size is required")
    .isInt({ max: 5 * 1024 * 1024 })
    .withMessage("Resume size must be under 5MB"),
  body("resume.data")
    .notEmpty()
    .withMessage("Resume file data is required"),

  body("status")
    .optional()
    .isIn(["pending", "approved", "rejected"])
    .withMessage("Invalid status value"),
];



