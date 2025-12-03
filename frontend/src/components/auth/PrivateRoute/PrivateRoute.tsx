import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * Componente para proteger rotas que necessitam autenticação
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return <LoadingSpinner fullScreen message="Verificando autenticação..." />;
  }

  // Usuário não autenticado - redirecionar para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar se necessita ser admin
  if (requireAdmin) {
    const userRole = user.role || "admin"; // Default para admin
    if (userRole !== "admin" && userRole !== "superAdmin") {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Usuário autenticado - renderizar componente
  return <>{children}</>;
};

export default PrivateRoute;
