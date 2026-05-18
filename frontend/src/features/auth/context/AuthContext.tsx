import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { AuthContextType, User } from "../types";
import { authService } from "../../../lib/apiService";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [user, setUser]                   = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing]   = useState<boolean>(true);

  // On mount, restore session from the stored token.
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { setIsInitializing(false); return; }

    authService.getMe()
      .then((u) => {
        setUser(u);
        setIsAuthenticated(true);
      })
      .catch(() => {
        // Token expired or invalid — clean up.
        localStorage.removeItem("auth_token");
      })
      .finally(() => setIsInitializing(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const { token, user: u } = await authService.login(email, password);
    localStorage.setItem("auth_token", token);
    setUser(u);
    setIsAuthenticated(true);
  }, []);

  const signup = useCallback(async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role: "guest" | "host",
  ): Promise<void> => {
    // Register, then auto-login to obtain a token.
    await authService.register({ firstName, lastName, email, password, role });
    const { token, user: u } = await authService.login(email, password);
    localStorage.setItem("auth_token", token);
    setUser(u);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback((): void => {
    localStorage.removeItem("auth_token");
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((updates: Partial<User>): void => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated, isInitializing, login, signup, logout, updateUser }),
    [user, isAuthenticated, isInitializing, login, signup, logout, updateUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used within an AuthProvider");
  return context;
}
