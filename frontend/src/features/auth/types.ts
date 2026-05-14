export type UserRole = "guest" | "host" | "admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string, role: "guest" | "host") => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}
