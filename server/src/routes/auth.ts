import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  me,
  updateProfile,
  changePassword,
} from "../controllers/authController";
import { ensureAuth } from "../middleware/auth";

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", ensureAuth, logout);
router.get("/me", ensureAuth, me);
router.put("/profile", ensureAuth, updateProfile);
router.put("/password", ensureAuth, changePassword);

export default router;
