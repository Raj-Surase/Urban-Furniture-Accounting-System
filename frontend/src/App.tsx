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

/**
 * Page imports — all lazy-loadable candidates if bundle size grows.
 * Split by domain: auth, core, accounting, purchasing, and reporting.
 */
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ItemsPage } from './pages/ItemsPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { NotFoundPage } from './pages/NotFoundPage';

import { InvoicesPage } from './pages/InvoicesPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { SalesOrdersPage } from './pages/SalesOrdersPage';
import { ProductsPage } from './pages/ProductsPage';
import { AccountsPage } from './pages/AccountsPage';
import { JournalPage } from './pages/JournalPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { CustomersPage } from './pages/CustomersPage';
import { VendorsPage } from './pages/VendorsPage';
import { ReportsPage } from './pages/ReportsPage';

/**
 * Root application component.
 *
 * Provider nesting order (outer → inner):
 *   ErrorBoundary → ThemeProvider → HeroUIProvider → ToastProvider
 *   → AuthProvider → SocketProvider → BrowserRouter
 *
 * Routing strategy:
 *  - GuestRoute:     redirects authenticated users away from /login, /register
 *  - ProtectedRoute: redirects unauthenticated users to /login
 *  - RoleRoute:      allows only specified roles (admin/manager); shows 403 otherwise
 */
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
                        path="invoices"
                        element={
                          <ProtectedRoute>
                            <InvoicesPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="purchase-orders"
                        element={
                          <ProtectedRoute>
                            <PurchaseOrdersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="sales-orders"
                        element={
                          <ProtectedRoute>
                            <SalesOrdersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="products"
                        element={
                          <ProtectedRoute>
                            <ProductsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="accounts"
                        element={
                          <ProtectedRoute>
                            <AccountsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="journal"
                        element={
                          <ProtectedRoute>
                            <JournalPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="payments"
                        element={
                          <ProtectedRoute>
                            <PaymentsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="customers"
                        element={
                          <ProtectedRoute>
                            <CustomersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="vendors"
                        element={
                          <ProtectedRoute>
                            <VendorsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="reports"
                        element={
                          <ProtectedRoute>
                            <ReportsPage />
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
