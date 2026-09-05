import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import { HeroUIProvider } from '@heroui/react';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleRoute } from './components/auth/RoleRoute';
import { GuestRoute } from './components/auth/GuestRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ItemsPage } from './pages/ItemsPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary componentName="Application Root">
      <ThemeProvider>
        <HeroUIProvider>
          <ToastProvider>
            <AuthProvider>
              <SocketProvider>
                <BrowserRouter>
                  <Routes>
                    {/* Public / Guest Routes */}
                    <Route
                      path="/login"
                      element={
                        <GuestRoute>
                          <LoginPage />
                        </GuestRoute>
                      }
                    />
                    <Route
                      path="/register"
                      element={
                        <GuestRoute>
                          <RegisterPage />
                        </GuestRoute>
                      }
                    />

                    {/* Authenticated Application with AppLayout */}
                    <Route path="/" element={<AppLayout />}>
                      <Route
                        index
                        element={
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="items"
                        element={
                          <ProtectedRoute>
                            <ItemsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="admin"
                        element={
                          <ProtectedRoute>
                            <RoleRoute requiredRole="admin">
                              <AdminPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="profile"
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="forbidden"
                        element={
                          <ProtectedRoute>
                            <ForbiddenPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<NotFoundPage />} />
                    </Route>
                  </Routes>
                </BrowserRouter>
              </SocketProvider>
            </AuthProvider>
          </ToastProvider>
        </HeroUIProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
