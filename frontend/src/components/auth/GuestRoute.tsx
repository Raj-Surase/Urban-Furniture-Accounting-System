import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/Spinner';

export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="lg" label="Checking authentication status..." />
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect authenticated users to home or intended location
    const destination = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};
