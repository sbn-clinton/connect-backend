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


const app = express();


dotenv.config();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Uppercase + added OPTIONS
  // allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));


// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Credentials", "true");
//   res.header("Access-Control-Allow-Origin", "https://connect-frontend-client.vercel.app");
//   next();
// });


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
   .then(() => console.log("MongoDB Connected"))
   .catch((err) => console.error(err));


// Middleware

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(urlencoded({ extended: true }));

// Configure sessions with proper cookie settings
app.set('trust proxy', 1); // keep this!

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Must be true in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Critical for cross-domain
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      path: '/', // Ensure cookies are available across all paths
      // domain: '.vercel.app'
    },
    proxy: process.env.NODE_ENV === 'production', // Important when behind a proxy (like Vercel)
  })
);


app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('session'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/files", express.static(path.join(__dirname, "files")));
// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/applications", applicationsRouter);  

app.get("/", (req, res) => {
   res.send("Hello World!");
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


