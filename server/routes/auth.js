// ─── Auth Routes ───
import { Router } from "express";
import jwt from "jsonwebtoken";
import { findUserByEmail, verifyPassword, sanitizeUser, users } from "../data/users.js";
import { generateToken } from "../middleware/auth.js";
import { addAuditEntry } from "../data/audit-log.js";

export const authRouter = Router();

// POST /api/auth/login
authRouter.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(user, password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  user.lastLogin = new Date().toISOString();
  const token = generateToken(user);

  addAuditEntry({
    userId: user.id,
    userName: user.name,
    action: "LOGIN",
    entity: "auth",
    details: `${user.role} logged in`,
  });

  res.json({
    token,
    user: sanitizeUser(user),
  });
});

// POST /api/auth/register
authRouter.post("/register", (req, res) => {
  const { email, name, password, role } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: "Email, name, and password are required" });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const validRoles = ["Admin", "QA Manager", "Lab Technician", "Auditor", "Supplier", "Field Inspector"];
  const userRole = validRoles.includes(role) ? role : "Lab Technician";

  const newUser = {
    id: crypto.randomUUID(),
    email,
    name,
    role: userRole,
    passwordHash: Buffer.from(password).toString("base64"),
    mfaEnabled: false,
    lastLogin: new Date().toISOString(),
    avatar: name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase(),
  };

  users.push(newUser);
  const token = generateToken(newUser);

  res.status(201).json({
    token,
    user: sanitizeUser(newUser),
  });
});

// GET /api/auth/me (requires token in header)
authRouter.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const jwtMod = jwt;
    const decoded = jwtMod.verify(authHeader.split(" ")[1], process.env.JWT_SECRET || "kiyo-pharma-secret-2026");
    const user = users.find((u) => u.id === decoded.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: sanitizeUser(user) });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// GET /api/auth/users (admin only, for demo)
authRouter.get("/users", (_req, res) => {
  res.json({
    users: users.map(sanitizeUser),
    demo_accounts: [
      { email: "admin@kiyo.io", password: "admin123", role: "Admin" },
      { email: "qa.manager@kiyo.io", password: "qa123", role: "QA Manager" },
      { email: "lab.tech@kiyo.io", password: "lab123", role: "Lab Technician" },
      { email: "auditor@kiyo.io", password: "audit123", role: "Auditor" },
      { email: "supplier@kiyo.io", password: "supplier123", role: "Supplier" },
      { email: "inspector@kiyo.io", password: "inspect123", role: "Field Inspector" },
    ],
  });
});
