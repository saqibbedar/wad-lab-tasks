import Session from "../models/session.model.js";
import { configDotenv } from "dotenv";
configDotenv();

const isLocalDev = true;

export default async function authMiddleware(req, res, next) {
  const token = req.cookies["auth-token"];
  const session = await Session.findOne({token}).populate({path: "user", select: "username _id"});
  if (!token) {
    // if no token found, logout user and remove existing session to clean database 
    res.clearCookie("auth-token");
    console.log(session || "No session");
    if(session) {
      await session.deleteOne();
    }
    return res.redirect(isLocalDev ? "/public/project/pages/Login.html" : "project/pages/Login.html");
  }
  if(!session || session.expiresAt < new Date()) {
    return res.redirect(isLocalDev ? "/public/project/pages/Login.html" : "project/pages/Login.html");
  }
  // payload for next
  /**
   * adding isAdmin attribute to avoid extra DB query in adminMiddleware
   */
  req.user = session.user;
  req.isAdmin = Boolean(session.user.username === "admin")
  // pass to next
  next();
}
