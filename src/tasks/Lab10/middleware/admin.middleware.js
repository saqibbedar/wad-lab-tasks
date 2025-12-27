// This middleware function will execute after authMiddleware, authMiddleware returns a user and isAdmin flag in request after verifying tokens, once auth-token is verified, it passes user and isAdmin in next. In this function, we are accessing those attributes and check if user is admin? If it is then unlock him admin protected routes.

// Basically, this function is utility that save our one more request to database for admin routes.
const adminMiddleware = () => {
  return (req, res, next) => {
    if (!req.isAdmin) {
      res.status(403).json({ error: "Forbidden: admin only" });
    }
    req.user;
    req.isAdmin;
    next();
  };
};

export default adminMiddleware;
