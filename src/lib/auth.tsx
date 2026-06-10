import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi, setTokens, clearTokens, getAccessToken, type ApiUser } from "./api";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  signup: (name: string, email: string, password: string, orgName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

function toAuthUser(u: ApiUser): AuthUser {
  return {
    id: u.id,
    name: u.fullName ?? u.email,
    email: u.email,
    role: u.role,
    organizationId: u.organizationId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from stored access token on mount
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ data }) => setUser(toAuthUser(data)))
      .catch(() => clearTokens())
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await authApi.login({ email, password });
      setTokens(data.accessToken, data.refreshToken);
      const authUser = toAuthUser(data.user);
      setUser(authUser);
      // Super admins belong at the admin dashboard
      const redirectTo = authUser.role === "super_admin" ? "/admin/dashboard" : "/dashboard";
      return { success: true, redirectTo };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Login failed" };
    }
  };

  const signup = async (name: string, email: string, password: string, orgName?: string) => {
    try {
      const { data } = await authApi.register({
        email,
        password,
        fullName: name,
        organizationName: orgName ?? `${name}'s Organization`,
      });
      setTokens(data.accessToken, data.refreshToken);
      setUser(toAuthUser(data.user));
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Registration failed" };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    clearTokens();
    setUser(null);
  };

  const isAdmin = user?.role === "super_admin";

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
