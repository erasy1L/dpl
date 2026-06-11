import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Spinner } from "./ui";
import { useLocale } from "../contexts/LocaleContext";
import * as m from "../paraglide/messages.js";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"user" | "manager" | "admin">;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  useLocale();
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">{m.loading()}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    (!user?.role || !allowedRoles.includes(user.role))
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
