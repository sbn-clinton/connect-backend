export const employeerAuthMiddleware = (req, res, next) => {
  console.log("Cookies:", req.cookies);
  console.log("Session:", req.session);
  console.log("UserSession:", req.session.user);
  if (req.isAuthenticated() && req.session.user.role === "employer") {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};


export const jobSeekerAuthMiddleware = (req, res, next) => {
  console.log("Cookies:", req.cookies);
  console.log("Session:", req.session);
  if (req.isAuthenticated() && req.user.role === "jobseeker") {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export const authMiddleware = (req, res, next) => {
  console.log("Cookies:", req.cookies);
  console.log("Session:", req.session);
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}