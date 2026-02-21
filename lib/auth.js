import crypto from "crypto";
import { cookies } from "next/headers";
import { getClient, ensureSchema } from "./db";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("base64url");
  if (expected !== sig) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function login(email, password) {
  const sql = getClient();
  const password_hash = hashPassword(password);

  const rows = await sql`SELECT id, email FROM users WHERE email = ${email} AND password_hash = ${password_hash} LIMIT 1`;
  const user = rows[0];
  if (!user) return null;

  const token = signToken({ userId: user.id, email: user.email });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  return user;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = verifyToken(token);
  if (!payload) return null;

  const sql = getClient();
  const rows = await sql`SELECT id, email FROM users WHERE id = ${payload.userId} LIMIT 1`;
  return rows[0] || null;
}

export async function seedDemoUser() {
  await ensureSchema();
  const sql = getClient();
  const email = "demo@example.com";
  const password_hash = hashPassword("password123");

  await sql`
    INSERT INTO users (email, password_hash)
    VALUES (${email}, ${password_hash})
    ON CONFLICT (email) DO NOTHING;
  `;

  return { email, password: "password123" };
}
