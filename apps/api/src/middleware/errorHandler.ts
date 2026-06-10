import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { logger } from "../lib/logger.ts";

export function errorHandler(err: unknown, c: Context) {
  if (err instanceof HTTPException) {
    return c.json({ success: false, error: err.message, code: err.status }, err.status);
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: "Validation failed",
        details: err.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
        code: 422,
      },
      422,
    );
  }

  // Postgres unique violation
  if ((err as any)?.code === "23505") {
    return c.json({ success: false, error: "Resource already exists", code: 409 }, 409);
  }

  // Postgres foreign key violation
  if ((err as any)?.code === "23503") {
    return c.json({ success: false, error: "Referenced resource does not exist", code: 400 }, 400);
  }

  logger.error({ err }, "Unhandled error");

  return c.json(
    {
      success: false,
      error: process.env.NODE_ENV === "production" ? "Internal server error" : String(err),
      code: 500,
    },
    500,
  );
}
