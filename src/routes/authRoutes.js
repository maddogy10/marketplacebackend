// file defines express routes for authentication-related endpoints, connects urls to functions in authController

// express imported to create a router, handles HTTP requests
import express from "express";

// imports controllers
import authController from "../controllers/authController.js";

// imports firebase auth checker
import authMiddleware from "../middleware/authMiddleware.js";

// creates router, express lets you organize routes into separate files
// this is specifically for authRoutes
const router = express.Router();

// routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authController.getMe);
router.get("/profile", authController.getMe);
router.get("/users", authMiddleware, authController.getAllUsers);
router.post("/token", authController.handleToken);

export default router;
