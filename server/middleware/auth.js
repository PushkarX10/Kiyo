// ─── Auth Middleware ───
import jwt from "jsonwebtoken";
import { getUserById } from "../data/users.js";

const JWT_SECRET = process.env.JWT_SECRET || "kiyo-pharma-secret-2026";

export function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Role-based access control
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(" or ")}` });
    }
    next();
  };
}

// Role permission matrix
export const ROLE_PERMISSIONS = {
  Admin: ["read", "write", "approve", "delete", "manage_users", "manage_settings", "view_audit"],
  "QA Manager": ["read", "write", "approve", "view_audit"],
  "Lab Technician": ["read", "write"],
  Auditor: ["read", "view_audit"],
  Supplier: ["read_own", "write_own"],
  "Field Inspector": ["read", "write_field"],
};
