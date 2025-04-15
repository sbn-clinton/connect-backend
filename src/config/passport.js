import { User } from "../models/schema.js";
import { Strategy as LocalStrategy } from "passport-local";
import passport from "passport";
import { comparePassword } from "../utils/helpers.js";


  passport.use(new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
    if (!user) throw new Error("Invalid Credentials");

    if (!comparePassword(password, user.password))  throw new Error("Invalid Credentials");

    return done(null, user);
    } catch (error) {
      console.log(error);
      return done(error, false, { message: "Internal server error" });
    }
    
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
    done(null, user);
    } catch (error) {
      done(error, false);
    }
  });

