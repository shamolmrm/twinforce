import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 100,
  admin: 80,
  manager: 60,
  employee: 40,
};

export function requireRole(...roles: string[]) {
  return createMiddleware(async (c: Context, next: Next) => {
    const user = c.get("user");
    if (!user) throw new HTTPException(401, { message: "Unauthorized" });

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const minRequired = Math.min(...roles.map((r) => ROLE_HIERARCHY[r] ?? 999));

    if (userLevel < minRequired) {
      throw new HTTPException(403, {
        message: `Insufficient permissions. Required: ${roles.join(" or ")}, got: ${user.role}`,
      });
    }
    return next();
  });
}

export function requireOwnerOrAdmin() {
  return requireRole("owner", "admin");
}

export function requireManager() {
  return requireRole("owner", "admin", "manager");
}

export function requireAnyRole() {
  return requireRole("owner", "admin", "manager", "employee");
}
