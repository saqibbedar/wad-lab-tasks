import Session from "../models/session.model.js";
import { configDotenv } from "dotenv";
configDotenv();

const isLocalDev = process.env.isLocalDev || false;

export default async function authMiddleware(req, res, next) {
  const token = req.cookies["auth-token"];
  if (!token) {
    return res.redirect(isLocalDev ? "/public/project/pages/Login.html" : "project/pages/Login.html");
  }
  const session = await Session.findOne({token}).populate({path: "user", select: "username _id"});
  if(!session || session.expiresAt < new Date()) {
    return res.redirect(isLocalDev ? "/public/project/pages/Login.html" : "project/pages/Login.html");
  }
  // payload for next
  /**
   * adding isAdmin attribute to avoid extra admin middleware and 
   */
  req.user = session.user;
  req.isAdmin = Boolean(session.user.username === "admin")
  // pass to next
  next();
}
