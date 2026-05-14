import { ComponentType } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";

export function withAuth<P extends object>(Component: ComponentType<P>): ComponentType<P> {
  function WithAuth(props: P): React.JSX.Element {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Component {...props} />;
  }
  WithAuth.displayName = `withAuth(${Component.displayName ?? Component.name})`;
  return WithAuth;
}
