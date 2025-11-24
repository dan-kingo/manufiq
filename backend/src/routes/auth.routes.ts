import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.get("/verify-email", AuthController.verifyEmail);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.post("/change-password", auth(), AuthController.changePassword);


export default router;
