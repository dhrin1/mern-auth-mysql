import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { RefreshToken } from "../entity/RefreshToken";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuditService } from "../services/auditService";
import { AuditAction } from "../entity/AuditLog";

const userRepo = () => AppDataSource.getRepository(User);
const tokenRepo = () => AppDataSource.getRepository(RefreshToken);

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwt";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "superrefreshsecret";

function createAccessToken(user: User) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "1h",
  });
}
function createRefreshToken(user: User) {
  return jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  try {
    const existing = await userRepo().findOne({ where: { email } });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user = userRepo().create({ email, password: hashed, name });
    await userRepo().save(user);

    await AuditService.logEvent(
      user.id,
      AuditAction.LOGIN_SUCCESS,
      "User registered and logged in successfully",
      req
    );

    res.json({ message: "registered" });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await userRepo().findOne({ where: { email } });
    if (!user) {
      await AuditService.logEvent(
        0,
        AuditAction.LOGIN_FAILED,
        `Failed login attempt for non-existent email: ${email}`,
        req
      );
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      await AuditService.logEvent(
        user.id,
        AuditAction.LOGIN_FAILED,
        "Invalid password provided",
        req
      );
      return res.status(400).json({ message: "Invalid credentials" });
    }

    await AuditService.logEvent(
      user.id,
      AuditAction.LOGIN_SUCCESS,
      "User logged in successfully",
      req
    );

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // CHANGE TO CAMELCASE
    const rt = tokenRepo().create({
      token: refreshToken,
      userId: user.id, // camelCase
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000), // camelCase
    });
    await tokenRepo().save(rt);

    res.cookie("jid", refreshToken, {
      httpOnly: true,
      // secure: true,
      sameSite: "lax",
      path: "/",
    });

    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.jid || req.body?.refreshToken;
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const payload: any = jwt.verify(token, JWT_REFRESH_SECRET);
    const stored = await tokenRepo().findOne({ where: { token } });
    if (!stored) return res.status(401).json({ message: "Invalid token" });

    const user = await userRepo().findOneBy({ id: payload.id });
    if (!user) return res.status(401).json({ message: "User not found" });

    const accessToken = createAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.jid || req.body?.refreshToken;
  const userId = (req as any).userId;

  if (token) {
    await tokenRepo().delete({ token });
  }

  if (userId) {
    await AuditService.logEvent(
      userId,
      AuditAction.LOGOUT,
      "User logged out successfully",
      req
    );
  }

  res.clearCookie("jid", { path: "/" });
  res.json({ message: "logged out" });
};

export const me = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ message: "Not authenticated" });
  const user = await userRepo().findOneBy({ id: userId });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ id: user.id, email: user.email, name: user.name });
};

export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ message: "Not authenticated" });

  const { name, email } = req.body;
  try {
    const user = await userRepo().findOneBy({ id: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const changes: string[] = [];
    const oldValues = {
      name: user.name,
      email: user.email,
    };

    if (name && name !== user.name) {
      changes.push(`name from "${user.name}" to "${name}"`);
      user.name = name;
    }

    if (email && email !== user.email) {
      const existingUser = await userRepo().findOne({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Email already taken" });
      }
      changes.push(`email from "${user.email}" to "${email}"`);
      user.email = email;
    }

    if (changes.length === 0) {
      return res.status(400).json({ message: "No changes provided" });
    }

    await userRepo().save(user);

    await AuditService.logEvent(
      userId,
      AuditAction.PROFILE_UPDATE,
      `Profile updated: ${changes.join(", ")}`,
      req
    );

    res.json({
      message: "Profile updated successfully",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ message: "Not authenticated" });

  const { currentPassword, newPassword } = req.body;
  try {
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await userRepo().findOneBy({ id: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      await AuditService.logEvent(
        userId,
        AuditAction.LOGIN_FAILED,
        "Failed password change: incorrect current password",
        req
      );
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await userRepo().save(user);

    await AuditService.logEvent(
      userId,
      AuditAction.PASSWORD_CHANGE,
      "Password changed successfully",
      req
    );

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};
