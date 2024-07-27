import express from "express";
import {
  signup,
  verifyEmail,
  login,
  resetPassword,
} from "../../controllers/AuthController.js";

const router = express.Router();

router.post("/signup", signup);
router.get("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/reset-password", resetPassword);

export default router;
