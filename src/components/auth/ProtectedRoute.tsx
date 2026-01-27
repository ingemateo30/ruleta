import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/api/auth';
import { USER_TYPES } from '@/api/types';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

/**
 * Componente que protege las rutas que requieren autenticacion.
 * Redirige al login si el usuario no esta autenticado.
 * Opcionalmente puede restringir por roles.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const user = authService.getCurrentUser();

  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    // Guardamos la ubicacion actual para redirigir despues del login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Si hay roles permitidos definidos, verificar que el usuario tenga uno de ellos
  if (allowedRoles && allowedRoles.length > 0) {
    const userType = String(user.tipo);
    if (!allowedRoles.includes(userType)) {
      // Usuario no tiene permisos, redirigir al dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Usuario autenticado y con permisos, renderizar el contenido
  return <>{children}</>;
}

/**
 * Componente que protege rutas solo para administradores (Admin y SuperAdmin)
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[USER_TYPES.SUPER_ADMIN, USER_TYPES.ADMIN]}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Componente que protege rutas solo para SuperAdmin
 */
export function SuperAdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[USER_TYPES.SUPER_ADMIN]}>
      {children}
    </ProtectedRoute>
  );
}

export default ProtectedRoute;
