import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { UserRole } from './types';

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

// Excalidraw Re-architecture Pages
import { VendorBillsPage } from './pages/VendorBillsPage';
import { ContactsPage } from './pages/ContactsPage';
import { JournalsPage } from './pages/JournalsPage';
import { AnalyticAccountsPage } from './pages/AnalyticAccountsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { ProfitAndLossReportPage } from './pages/ProfitAndLossReportPage';
import { BalanceSheetReportPage } from './pages/BalanceSheetReportPage';
import { BudgetReportPage } from './pages/BudgetReportPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { WorkshopPage } from './pages/WorkshopPage';

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
                      {/* Vendor Bills (Excalidraw Purchase Bill) */}
                      <Route
                        path="bills"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.USER, UserRole.CUSTOMER, UserRole.VENDOR]}>
                              <VendorBillsPage />
                            </RoleRoute>
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
                      {/* Unified Contact Master */}
                      <Route
                        path="contacts"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]}>
                              <ContactsPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      {/* Journals Master */}
                      <Route
                        path="journals"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]}>
                              <JournalsPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      {/* Analytic Accounts (Cost Centers) */}
                      <Route
                        path="analyticals"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]}>
                              <AnalyticAccountsPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      {/* Budgets */}
                      <Route
                        path="budgets"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]}>
                              <BudgetsPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="budgets/:id"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]}>
                              <BudgetsPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      {/* Accounting Budgets Aliases (Ensures deep-links & legacy routes navigate correctly) */}
                      <Route
                        path="accounting/budgets"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]}>
                              <BudgetsPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="accounting/budgets/:id"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]}>
                              <BudgetsPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="accounts"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]}>
                              <AccountsPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="journal"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]}>
                              <JournalPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="payments"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.USER, UserRole.CUSTOMER, UserRole.VENDOR]}>
                              <PaymentsPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="payments/new"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.USER, UserRole.CUSTOMER, UserRole.VENDOR]}>
                              <PaymentsPage openNew={true} />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="customers"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.USER, UserRole.CUSTOMER, UserRole.VENDOR]}>
                              <CustomersPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="vendors"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.USER, UserRole.CUSTOMER, UserRole.VENDOR]}>
                              <VendorsPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="reports"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]}>
                              <ReportsPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      {/* Dedicated Excalidraw Financial Reports */}
                      <Route
                        path="reports/profit-loss"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]}>
                              <ProfitAndLossReportPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="reports/balance-sheet"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]}>
                              <BalanceSheetReportPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="reports/budget"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]}>
                              <BudgetReportPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />
                      {/* 3D Workshop & Joinery Studio (Excalidraw Custom Furniture) */}
                      <Route
                        path="workshop"
                        element={
                          <ProtectedRoute>
                            <WorkshopPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="studio"
                        element={
                          <ProtectedRoute>
                            <WorkshopPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Customer / User Portal */}
                      <Route
                        path="portal"
                        element={
                          <ProtectedRoute>
                            <CustomerPortalPage />
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
                            <RoleRoute requiredRole={UserRole.ADMIN}>
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

                      {/* =========================================================================
                          DOCUMENTATION & EXCALIDRAW ROUTE ALIASES (Prevents 404 Route Not Found)
                          Maps different module naming conventions to canonical destinations
                          ========================================================================= */}
                      {/* Sales Aliases */}
                      <Route path="sales-order" element={<Navigate to="/sales-orders" replace />} />
                      <Route path="sales" element={<Navigate to="/sales-orders" replace />} />
                      <Route path="so" element={<Navigate to="/sales-orders" replace />} />
                      <Route path="sale-invoice" element={<Navigate to="/invoices" replace />} />
                      <Route path="sale-invoices" element={<Navigate to="/invoices" replace />} />
                      <Route path="sales-invoice" element={<Navigate to="/invoices" replace />} />
                      <Route path="sales-invoices" element={<Navigate to="/invoices" replace />} />
                      <Route path="customer-invoice" element={<Navigate to="/invoices" replace />} />
                      <Route path="customer-invoices" element={<Navigate to="/invoices" replace />} />
                      <Route path="receipt" element={<Navigate to="/payments?type=receive" replace />} />
                      <Route path="receipts" element={<Navigate to="/payments?type=receive" replace />} />
                      <Route path="customer-receipts" element={<Navigate to="/payments?type=receive" replace />} />

                      {/* Purchase Aliases */}
                      <Route path="purchase-order" element={<Navigate to="/purchase-orders" replace />} />
                      <Route path="purchases" element={<Navigate to="/purchase-orders" replace />} />
                      <Route path="po" element={<Navigate to="/purchase-orders" replace />} />
                      <Route path="purchase-bill" element={<Navigate to="/bills" replace />} />
                      <Route path="purchase-bills" element={<Navigate to="/bills" replace />} />
                      <Route path="vendor-bill" element={<Navigate to="/bills" replace />} />
                      <Route path="vendor-bills" element={<Navigate to="/bills" replace />} />
                      <Route path="payment" element={<Navigate to="/payments?type=send" replace />} />
                      <Route path="vendor-payments" element={<Navigate to="/payments?type=send" replace />} />

                      {/* Account Master Data Aliases */}
                      <Route path="contact" element={<Navigate to="/contacts" replace />} />
                      <Route path="contact-master" element={<Navigate to="/contacts" replace />} />
                      <Route path="contacts-master" element={<Navigate to="/contacts" replace />} />
                      <Route path="partners" element={<Navigate to="/contacts" replace />} />
                      <Route path="product" element={<Navigate to="/products" replace />} />
                      <Route path="product-master" element={<Navigate to="/products" replace />} />
                      <Route path="catalog" element={<Navigate to="/products" replace />} />
                      <Route path="chart-of-accounts" element={<Navigate to="/accounts" replace />} />
                      <Route path="chart-of-account" element={<Navigate to="/accounts" replace />} />
                      <Route path="coa" element={<Navigate to="/accounts" replace />} />
                      <Route path="account" element={<Navigate to="/accounts" replace />} />
                      <Route path="accounts-chart" element={<Navigate to="/accounts" replace />} />
                      <Route path="journal-master" element={<Navigate to="/journals" replace />} />
                      <Route path="journals-master" element={<Navigate to="/journals" replace />} />
                      <Route path="journal-entries" element={<Navigate to="/journal" replace />} />
                      <Route path="journal-entry" element={<Navigate to="/journal" replace />} />
                      <Route path="entries" element={<Navigate to="/journal" replace />} />
                      <Route path="journals/entries" element={<Navigate to="/journal" replace />} />
                      <Route path="analytic-accounts" element={<Navigate to="/analyticals" replace />} />
                      <Route path="analytic-account" element={<Navigate to="/analyticals" replace />} />
                      <Route path="analytics" element={<Navigate to="/analyticals" replace />} />
                      <Route path="cost-centers" element={<Navigate to="/analyticals" replace />} />
                      <Route path="budget" element={<Navigate to="/budgets" replace />} />
                      <Route path="analytical-budget" element={<Navigate to="/budgets" replace />} />
                      <Route path="analytical-budgets" element={<Navigate to="/budgets" replace />} />
                      <Route
                        path="budget/:id"
                        element={
                          <ProtectedRoute>
                            <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]}>
                              <BudgetsPage />
                            </RoleRoute>
                          </ProtectedRoute>
                        }
                      />

                      {/* Financial Reports Aliases */}
                      <Route path="balancesheet" element={<Navigate to="/reports/balance-sheet" replace />} />
                      <Route path="balance-sheet" element={<Navigate to="/reports/balance-sheet" replace />} />
                      <Route path="reports/balancesheet" element={<Navigate to="/reports/balance-sheet" replace />} />
                      <Route path="profit-loss" element={<Navigate to="/reports/profit-loss" replace />} />
                      <Route path="profit-and-loss" element={<Navigate to="/reports/profit-loss" replace />} />
                      <Route path="pnl" element={<Navigate to="/reports/profit-loss" replace />} />
                      <Route path="reports/profit-and-loss" element={<Navigate to="/reports/profit-loss" replace />} />
                      <Route path="reports/pnl" element={<Navigate to="/reports/profit-loss" replace />} />
                      <Route path="budget-report" element={<Navigate to="/reports/budget" replace />} />
                      <Route path="budget-reports" element={<Navigate to="/reports/budget" replace />} />
                      <Route path="reports/budget-report" element={<Navigate to="/reports/budget" replace />} />
                      <Route path="reports/budget-reports" element={<Navigate to="/reports/budget" replace />} />

                      {/* Portal & Operations Aliases */}
                      <Route path="customer-portal" element={<Navigate to="/portal" replace />} />
                      <Route path="client-portal" element={<Navigate to="/portal" replace />} />
                      <Route path="portal/invoices" element={<Navigate to="/portal" replace />} />
                      <Route path="workshop-items" element={<Navigate to="/items" replace />} />
                      <Route path="operations" element={<Navigate to="/items" replace />} />
                      <Route path="operations-tracker" element={<Navigate to="/items" replace />} />

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
