import express from "express";
import { loginWithEmailPassword } from "../services/authService.js";

const router = express.Router();

// POST /api/auth/login - email/password login for seeded accounts
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    const user = await loginWithEmailPassword(email, password);
    // Token is a placeholder for now; real JWT can replace this later.
    const token = "mock-token";
    res.json({ token, user });
  } catch (error) {
    next(error);
  }
});

export default router;

