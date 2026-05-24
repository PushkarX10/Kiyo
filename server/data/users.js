// ─── Users Data Store ───
import { v4 as uuid } from "uuid";

// Simple hash for demo (NOT production-safe — use bcrypt in real app)
const simpleHash = (pw) => Buffer.from(pw).toString("base64");

export const users = [
  {
    id: uuid(),
    email: "admin@kiyo.io",
    name: "Dr. Vikram Patel",
    role: "Admin",
    passwordHash: simpleHash("admin123"),
    mfaEnabled: true,
    lastLogin: "2026-05-23T09:00:00Z",
    avatar: "VP",
  },
  {
    id: uuid(),
    email: "qa.manager@kiyo.io",
    name: "Dr. Anika Rao",
    role: "QA Manager",
    passwordHash: simpleHash("qa123"),
    mfaEnabled: false,
    lastLogin: "2026-05-23T08:30:00Z",
    avatar: "AR",
  },
  {
    id: uuid(),
    email: "lab.tech@kiyo.io",
    name: "R. Mehta",
    role: "Lab Technician",
    passwordHash: simpleHash("lab123"),
    mfaEnabled: false,
    lastLogin: "2026-05-23T07:45:00Z",
    avatar: "RM",
  },
  {
    id: uuid(),
    email: "auditor@kiyo.io",
    name: "S. Krishnamurthy",
    role: "Auditor",
    passwordHash: simpleHash("audit123"),
    mfaEnabled: true,
    lastLogin: "2026-05-22T14:00:00Z",
    avatar: "SK",
  },
  {
    id: uuid(),
    email: "supplier@kiyo.io",
    name: "Chen Wei",
    role: "Supplier",
    passwordHash: simpleHash("supplier123"),
    mfaEnabled: false,
    lastLogin: "2026-05-21T10:00:00Z",
    avatar: "CW",
  },
  {
    id: uuid(),
    email: "inspector@kiyo.io",
    name: "P. Sharma",
    role: "Field Inspector",
    passwordHash: simpleHash("inspect123"),
    mfaEnabled: false,
    lastLogin: "2026-05-20T11:30:00Z",
    avatar: "PS",
  },
];

export function findUserByEmail(email) {
  return users.find((u) => u.email === email);
}

export function verifyPassword(user, password) {
  return user.passwordHash === simpleHash(password);
}

export function getUserById(id) {
  return users.find((u) => u.id === id);
}

export function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}
