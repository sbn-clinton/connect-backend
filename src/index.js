import express, { urlencoded } from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import jobsRouter from "./routes/jobs.js";
import applicationsRouter from "./routes/application.js";
import "./config/passport.js";
import  MongoStore  from 'connect-mongo';
import cookieParser from "cookie-parser";
import { upload } from "./config/pdfUpload.js";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { FileModel} from "./models/schema.js";
import { Application, User } from "./models/schema.js";


dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
   
   serverSelectionTimeoutMS: 20000, // Increases timeout
   socketTimeoutMS: 45000,
 })
   .then(() => console.log("MongoDB Connected"))
   .catch((err) => console.error(err));

const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: process.env.FRONTEND_URL }));
app.use(session({ secret: "your_secret", resave: false, saveUninitialized: false, 
   store: MongoStore.create({ 
      client: mongoose.connection.getClient(),
      collection: "sessions",
    }),
   cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24}, // 1-day expiration
}));
// 1000 * 60 * 60 * 24 = 1 day
app.use(cookieParser());
app.use(passport.authenticate('session'));
app.use(passport.initialize());
app.use(passport.session());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/files", express.static(path.join(__dirname, "files")));
// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/applications", applicationsRouter);  

app.get("/", (req, res) => {
   req.user ? res.send(`Hello World ${req.user.email}!`) : res.send("Hello World!");
});

app.post('/files', upload.single('file'), async function (req, res, ) {
   console.log(req.file);
   try {
      const newFile = await FileModel.create({
         name: req.file.originalname,
         mimetype: req.file.mimetype,
         size: req.file.size,
         data: req.file.buffer,
      });
      res.status(201).json(newFile);
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error uploading file" });
   }
})

app.get("/files", async (req, res) => {
  try {
    const files = await FileModel.find();
    res.status(200).json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving files" });
  }
});

// Serve single image by ID
app.get("/files/:id", async (req, res) => {
   try {
     const file = await FileModel.findById(req.params.id);
 
     if (!file) {
       return res.status(404).send("File not found");
     }
 
     res.set({
       "Content-Type": file.mimetype,
       "Content-Disposition": `inline; filename="${file.name}"`,
     });
 
     res.send(file.data); // This sends the image buffer
   } catch (error) {
     console.error(error);
     res.status(500).send("Error retrieving file");
   }
 });

// Update the GET route to match your storage structure
app.get("/api/users-picture/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || !user.profilePicture || !user.profilePicture.fileData) {
    return res.status(404).send("User not found");
  }
  res.set({
    "Content-Type": user.profilePicture.fileType,
    "Content-Disposition": `inline; filename="${user.profilePicture.fileName}"`,
  });
  res.send(user.profilePicture.fileData); // Remove .buffer if fileData is already a buffer
});
  

 app.get("/resume/:appId", async (req, res) => {
   const application = await Application.findById(req.params.appId)
   if (!application || !application.resume || !application.resume.data) {
     return res.status(404).send("Resume not found");
   }
 
   res.set({
     "Content-Type": application.resume.mimetype,
     "Content-Disposition": `inline; filename="${application.resume.name}"`,
   });
 
   res.send(application.resume.data);
 });
 

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));  


// {
//    "title": "Backend Developer ",
//    "company": "SBN-dev company ",
//    "description": "Nextjs and Expres developer",
//    "location": "Enugu",
//    "requirements": ["passport", "mongodb", "session"],
//    "salary": "$2000"
//  }

// http://localhost:3000/api/applications/67e935f14854cc92f2790590/apply

// {
//    "resume": "This is my full my Resume.pdf",
//    "coverLetter": "this is my Cover-Letter"
//  }

// {
//    "name": "Chiamaka",
//    "email": "chiamaka@gmail.com",
//    "password": "1234"
//  }

// http://localhost:3000/api/applications/67e85b8e7883fc77cb318737/status