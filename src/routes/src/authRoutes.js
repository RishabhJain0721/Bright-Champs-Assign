import express from "express";
import {
  signup,
  verifyEmail,
  login,
  resetPassword,
  resetPage,
  reset,
} from "../../controllers/AuthController.js";

const router = express.Router();

router.post("/signup", signup);
router.get("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/reset-password", resetPassword);
router.get("/reset-page", resetPage);
router.post("/reset", reset);

export default router;
