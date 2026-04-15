import express from "express";
import { attachAuth, requireAuth, requireRole } from "../middleware/roleAuth.js";
import {
  createUserAccount,
  deleteUserById,
  listUsers,
  patchUserById,
  updateUserRoleById
} from "../services/userService.js";

const router = express.Router();

router.use(attachAuth);
router.use(requireAuth);
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
    const { email, role, displayName, password } = req.body ?? {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }
    if (!role || typeof role !== "string") {
      return res.status(400).json({ error: "role is required" });
    }
    if (password !== undefined && typeof password !== "string") {
      return res.status(400).json({ error: "password must be a string when provided" });
    }
    const created = await createUserAccount({
      email: email.trim(),
      role,
      displayName: typeof displayName === "string" ? displayName : undefined,
      password
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

// PATCH /api/users/:id — partial update: role, is_active, email, displayName (or display_name), password
router.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const body = req.body ?? {};
    const patch = {};
    if (body.role !== undefined && typeof body.role === "string") {
      patch.role = body.role;
    }
    if (typeof body.is_active === "boolean") {
      patch.isActive = body.is_active;
    }
    if (body.email !== undefined && typeof body.email === "string") {
      patch.email = body.email;
    }
    if (body.displayName !== undefined) {
      patch.displayName = body.displayName;
    } else if (body.display_name !== undefined) {
      patch.displayName = body.display_name;
    }
    if (body.password !== undefined && typeof body.password === "string") {
      patch.password = body.password;
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    const updated = await patchUserById(id, patch);
    return res.json(updated);
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

