import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authApi, setTokens } from "@/lib/api";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

/**
 * Handles three types of callbacks that land here:
 * 1. Supabase OAuth (Google/GitHub/Microsoft) — hash fragment with access_token
 * 2. Supabase magic link — same hash fragment pattern
 * Both cases: extract the Supabase access_token, call our /auth/oauth/sync to
 * get our own JWT pair, store them, then redirect to the appropriate dashboard.
 */
function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function handleCallback() {
      if (typeof window === "undefined") return;

      // Supabase puts tokens in the URL hash: #access_token=xxx&refresh_token=xxx&...
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const supabaseToken = params.get("access_token");
      const errorCode = params.get("error");
      const errorDescription = params.get("error_description");

      // Also support direct query params (future / server-side flows)
      const searchParams = new URLSearchParams(window.location.search);
      const directAccessToken = searchParams.get("at");
      const directRefreshToken = searchParams.get("rt");

      if (errorCode) {
        setErrorMsg(errorDescription ?? errorCode ?? "OAuth authentication failed");
        setStatus("error");
        return;
      }

      if (directAccessToken && directRefreshToken) {
        // Direct JWT handoff (used by backend-mediated OAuth)
        setTokens(directAccessToken, directRefreshToken);
        // Determine redirect from user role in the token
        const meRes = await authApi.me().catch(() => null);
        const role = meRes?.data?.role;
        navigate({ to: role === "super_admin" ? "/admin/dashboard" : "/dashboard" });
        return;
      }

      if (supabaseToken) {
        // Exchange Supabase token for our JWT
        try {
          const { data } = await authApi.oauthSync(supabaseToken);
          setTokens(data.accessToken, data.refreshToken);
          const redirectTo = data.user.role === "super_admin" ? "/admin/dashboard" : "/dashboard";
          navigate({ to: redirectTo });
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Authentication failed. Please try again.");
          setStatus("error");
        }
        return;
      }

      // No tokens found in the URL
      setErrorMsg("No authentication data found. Please try signing in again.");
      setStatus("error");
    }

    handleCallback();
  }, [navigate]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.15),transparent)]"
        />
        <div className="relative w-full max-w-sm space-y-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 mx-auto">
            <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in failed</h1>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.15),transparent)]"
      />
      <div className="relative flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Completing sign in…</p>
      </div>
    </div>
  );
}
