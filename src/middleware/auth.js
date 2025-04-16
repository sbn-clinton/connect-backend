export const employeerAuthMiddleware = (req, res, next) => {
  
  if (req.isAuthenticated() && req.user.role === "employer") {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};


export const jobSeekerAuthMiddleware = (req, res, next) => {
  console.log('Authenticated:', req.isAuthenticated());
  console.log('User:', req.user);
  if (req.isAuthenticated() && req.user.role === "jobseeker") {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export const authMiddleware = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}