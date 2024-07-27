import express from "express";
import authRoutes from "./src/authRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);

export default router;
