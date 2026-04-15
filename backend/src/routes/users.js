import express from "express";
import { attachRole, requireRole } from "../middleware/roleAuth.js";
import {
  createUserAccount,
  deleteUserById,
  listUsers,
  setUserActiveById,
  updateUserRoleById
} from "../services/userService.js";

const router = express.Router();

router.use(attachRole);
router.use(requireRole(["admin"]));

// GET /api/users - list all users
router.get("/", async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// POST /api/users - create user (or reactivate/update role on conflict)
router.post("/", async (req, res, next) => {
  try {
    const { email, role, displayName } = req.body ?? {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }
    if (!role || typeof role !== "string") {
      return res.status(400).json({ error: "role is required" });
    }
    const created = await createUserAccount({
      email: email.trim(),
      role,
      displayName: typeof displayName === "string" ? displayName : undefined
    });
    return res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id - update role
router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const { role } = req.body ?? {};
    if (!role || typeof role !== "string") {
      return res.status(400).json({ error: "role is required" });
    }
    const updated = await updateUserRoleById(id, role);
    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id - update role and/or is_active
router.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const { role, is_active: isActive } = req.body ?? {};
    if (typeof isActive === "boolean") {
      const updated = await setUserActiveById(id, isActive);
      if (role && typeof role === "string") {
        const withRole = await updateUserRoleById(id, role);
        return res.json(withRole);
      }
      return res.json(updated);
    }
    if (role && typeof role === "string") {
      const updated = await updateUserRoleById(id, role);
      return res.json(updated);
    }
    return res.status(400).json({ error: "Provide role and/or is_active" });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - soft-delete (set is_active = false)
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const updated = await deleteUserById(id);
    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;

