import admin from "../config/firebase.js";

// middleware function with three arguments: req is incoming request, res is response back, and next tells express middleware is done move onto next thing
const authMiddleware = async (req, res, next) => {
  try {
    // get authorization header
    const authHeader = req.headers.authorization;

    // extract token, shorthand if/else
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    // check if token exists
    if (!token) {
      return res.status(401).json({ error: "No Firebase ID token provided" });
    }

    // verify firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // attach user information to the request, adds new property to object, later routes can access req.user.uid without verifying Firebase again
    req.user = decodedToken;

    // continue the route, let controller run
    next();
  } catch (error) {
    console.error("Firebase Auth middleware error: ", error);
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "Firebase ID token expired" });
    }
    if (error.code === "auth/invalid-id-token") {
      return res.status(401).json({ error: "Invalid Firebase ID token" });
    }
    res
      .status(500)
      .json({ error: "Internal server error during authentication" });
  }
};

export default authMiddleware;
