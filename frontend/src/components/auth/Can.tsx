import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface CanProps {
  /**
   * One or more roles required to render children (e.g. 'admin' or ['admin', 'manager'])
   */
  role?: string | string[];

  /**
   * One or more permissions required to render children (e.g. 'items:delete_any')
   */
  permission?: string | string[];

  /**
   * Evaluation strategy when multiple permissions or both role and permission are passed:
   * 'any': passes if ANY condition is met
   * 'all': passes only if ALL conditions are met (default)
   */
  strategy?: 'any' | 'all';

  /**
   * Optional fallback node to render when access is denied (e.g. disabled button, locked icon, tooltip)
   */
  fallback?: React.ReactNode;

  /**
   * Content to render if authorized
   */
  children: React.ReactNode;
}

/**
 * Declarative Role & Permission Access Gate component.
 *
 * Example:
 * ```tsx
 * <Can role="admin" fallback={<Button isDisabled>Delete (Admin Only)</Button>}>
 *   <Button color="danger" onPress={handleDelete}>Delete Item</Button>
 * </Can>
 * ```
 */
export const Can: React.FC<CanProps> = ({
  role,
  permission,
  strategy = 'all',
  fallback = null,
  children,
}) => {
  const { user, hasRole, hasPermission } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  // Admin superuser always has clearance unless explicitly restricted
  if (user.role === 'admin') {
    return <>{children}</>;
  }

  let roleGranted = true;
  if (role) {
    roleGranted = hasRole(role);
  }

  let permissionGranted = true;
  if (permission) {
    if (Array.isArray(permission)) {
      permissionGranted = strategy === 'any'
        ? permission.some((p) => hasPermission(p))
        : permission.every((p) => hasPermission(p));
    } else {
      permissionGranted = hasPermission(permission);
    }
  }

  const isAuthorized = strategy === 'any'
    ? (role ? roleGranted : false) || (permission ? permissionGranted : false)
    : roleGranted && permissionGranted;

  if (isAuthorized) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * Convenient hook for imperative permission checks.
 */
export const usePermissions = () => {
  const { user, hasRole, hasPermission, isAdmin, isManager, isStandardUser } = useAuth();

  return {
    user,
    role: user?.role,
    permissions: user?.permissions || [],
    isAdmin,
    isManager,
    isStandardUser,
    hasRole,
    hasPermission,
    can: hasPermission,
  };
};

export default Can;

