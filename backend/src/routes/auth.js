import express from "express";
import { loginWithEmailPassword } from "../services/authService.js";
import { signAuthToken } from "../services/jwtService.js";

const router = express.Router();

// POST /api/auth/login - email/password login for seeded accounts
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    const user = await loginWithEmailPassword(email, password);
    const token = signAuthToken({ userId: user.id, role: user.role, email: user.email });
    res.json({ token, user });
  } catch (error) {
    next(error);
  }
});

export default router;

