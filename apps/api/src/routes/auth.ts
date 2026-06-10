import { Hono } from "hono";
import { z } from "zod";
import * as authService from "../services/auth.service.ts";
import { requireAuth } from "../middleware/auth.ts";
import { authRateLimit } from "../middleware/rateLimit.ts";
import { auditLog } from "../middleware/audit.ts";
import { supabaseAdmin } from "../lib/supabase.ts";

const router = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(255),
  organizationName: z.string().min(2).max(255),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Register ─────────────────────────────────────────────────────────────────
router.post("/register", authRateLimit, auditLog("auth.register"), async (c) => {
  const body = await c.req.json();
  const input = registerSchema.parse(body);
  const result = await authService.register(input);
  return c.json({ success: true, data: result }, 201);
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post("/login", authRateLimit, auditLog("auth.login"), async (c) => {
  const body = await c.req.json();
  const input = loginSchema.parse(body);
  const result = await authService.login(input.email, input.password);
  return c.json({ success: true, data: result });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post("/logout", requireAuth, auditLog("auth.logout"), async (c) => {
  const token = c.req.header("Authorization")!.slice(7);
  await authService.logout(token);
  return c.json({ success: true });
});

// ─── Token Refresh ────────────────────────────────────────────────────────────
router.post("/refresh", authRateLimit, async (c) => {
  const { refreshToken } = await c.req.json();
  if (!refreshToken) return c.json({ success: false, error: "refreshToken required" }, 400);
  const result = await authService.refreshTokens(refreshToken);
  return c.json({ success: true, data: result });
});

// ─── Forgot / Reset Password ──────────────────────────────────────────────────
router.post("/forgot-password", authRateLimit, async (c) => {
  const { email } = await c.req.json();
  if (!email) return c.json({ success: false, error: "email required" }, 400);
  await authService.sendPasswordReset(email);
  return c.json({ success: true, message: "If that email exists, a reset link has been sent" });
});

router.post("/reset-password", authRateLimit, async (c) => {
  const { token, password } = await c.req.json();
  if (!token || !password) return c.json({ success: false, error: "token and password required" }, 400);
  await authService.resetPassword(token, password);
  return c.json({ success: true, message: "Password reset successful" });
});

// ─── Magic Link ───────────────────────────────────────────────────────────────
router.post("/magic-link", authRateLimit, async (c) => {
  const { email } = await c.req.json();
  if (!email) return c.json({ success: false, error: "email required" }, 400);
  await authService.sendMagicLink(email);
  return c.json({ success: true, message: "Magic link sent — check your inbox" });
});

// ─── Current User ─────────────────────────────────────────────────────────────
router.get("/me", requireAuth, async (c) => {
  const user = c.get("user");
  return c.json({ success: true, data: user });
});

// ─── OAuth: Google ────────────────────────────────────────────────────────────
router.get("/google", (c) => {
  const callbackUrl = `${process.env.FRONTEND_URL}/auth/callback`;
  const redirectUrl = `${process.env.SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(callbackUrl)}`;
  return c.redirect(redirectUrl);
});

// ─── OAuth: GitHub ────────────────────────────────────────────────────────────
router.get("/github", (c) => {
  const callbackUrl = `${process.env.FRONTEND_URL}/auth/callback`;
  const redirectUrl = `${process.env.SUPABASE_URL}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(callbackUrl)}`;
  return c.redirect(redirectUrl);
});

// ─── OAuth: Microsoft ─────────────────────────────────────────────────────────
router.get("/microsoft", (c) => {
  const callbackUrl = `${process.env.FRONTEND_URL}/auth/callback`;
  const redirectUrl = `${process.env.SUPABASE_URL}/auth/v1/authorize?provider=azure&redirect_to=${encodeURIComponent(callbackUrl)}`;
  return c.redirect(redirectUrl);
});

// ─── OAuth Sync ───────────────────────────────────────────────────────────────
// Called from the frontend /auth/callback page after Supabase OAuth completes.
// The frontend receives a Supabase access_token in the URL hash, then POSTs it
// here to exchange for our own JWT pair.
router.post("/oauth/sync", authRateLimit, async (c) => {
  const body = await c.req.json();
  const { supabaseToken } = body;
  if (!supabaseToken) {
    return c.json({ success: false, error: "supabaseToken required" }, 400);
  }

  const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(supabaseToken);
  if (error || !supabaseUser) {
    return c.json({ success: false, error: "Invalid or expired Supabase token" }, 401);
  }

  const fullName =
    supabaseUser.user_metadata?.full_name ??
    supabaseUser.user_metadata?.name ??
    undefined;

  const result = await authService.syncOAuthUser(
    supabaseUser.id,
    supabaseUser.email!,
    fullName,
  );

  return c.json({ success: true, data: result });
});

export default router;
