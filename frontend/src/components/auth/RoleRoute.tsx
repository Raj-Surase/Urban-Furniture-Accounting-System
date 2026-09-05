import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface RoleRouteProps {
  requiredRole?: 'admin' | 'manager' | 'accountant' | 'user';
  allowedRoles?: Array<'admin' | 'manager' | 'accountant' | 'user'>;
  requiredPermission?: string;
  children: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  requiredRole,
  allowedRoles,
  requiredPermission,
  children,
}) => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin superuser always bypasses checks unless specifically constrained
  if (user.role === 'admin') {
    return <>{children}</>;
  }

  // Check roles
  let roleAllowed = true;
  const targetRoles = allowedRoles || (requiredRole ? [requiredRole] : []);
  if (targetRoles.length > 0) {
    roleAllowed = targetRoles.includes(user.role);
  }

  // Check permission
  let permissionAllowed = true;
  if (requiredPermission) {
    permissionAllowed = hasPermission(requiredPermission);
  }

  const hasAccess = roleAllowed && permissionAllowed;

  if (!hasAccess) {
    return (
      <Navigate
        to="/forbidden"
        state={{
          requiredRole: requiredRole || (targetRoles.length > 0 ? targetRoles.join(' or ') : undefined),
          requiredPermission,
          from: location,
        }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default RoleRoute;
