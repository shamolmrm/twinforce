import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import type { ZodSchema } from "zod";
import { HTTPException } from "hono/http-exception";

export function validateBody<T>(schema: ZodSchema<T>) {
  return createMiddleware(async (c: Context, next: Next) => {
    const body = await c.req.json().catch(() => null);
    if (body === null) throw new HTTPException(400, { message: "Request body must be valid JSON" });
    const result = schema.safeParse(body);
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: "Validation failed",
          details: result.error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        422,
      );
    }
    c.set("body" as any, result.data);
    return next();
  });
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return createMiddleware(async (c: Context, next: Next) => {
    const query = c.req.query();
    const result = schema.safeParse(query);
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: result.error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
        422,
      );
    }
    c.set("query" as any, result.data);
    return next();
  });
}
