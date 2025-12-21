import Session from "../models/session.model.js";

const isLocalDev = process.env.isLocalDev || false;

export default async function authMiddleware(req, res, next) {
  const token = req.cookies["auth-token"];
  if (!token) {
    return res.redirect(isLocalDev ? "/public/project/pages/Login.html" : "project/pages/Login.html");
  }
  const session = await Session.findOne({token}).populate("userId");
  if(!session || session.expiresAt < new Date) {
    return res.redirect(isLocalDev ? "/public/project/pages/Login.html" : "project/pages/Login.html");
  }
  next();
}
