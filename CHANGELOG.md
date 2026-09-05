# Changelog

All notable changes to **Urban Furniture Accounting System** are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- PHPDoc property annotations on `Invoice` and `Product` Eloquent models
- Method-level `@param` / `@return` PHPDoc on `InvoiceController` and `PaymentController`
- Structured header comment block in `index.css` describing design token categories
- Inline comments in `main.tsx` explaining `React.StrictMode` and mount target
- JSDoc block on root `App` component documenting provider nesting order and routing guards
- Improved inline comments in `DashboardController` clarifying GL account codes and KPI queries

---

## [1.0.0] — 2026-09-05

### Added
- **Frontend**: React Vite + TypeScript + Tailwind CSS project scaffold with HeroUI component library
- **Frontend**: Full accounting page suite — Invoices, Payments, Journal, Accounts, PurchaseOrders, SalesOrders, Products, Customers, Vendors, Reports, Admin
- **Frontend**: Context providers — Auth, Theme, Socket, Toast; Axios API client with Bearer token interceptors
- **Frontend**: Role-based route guards (`ProtectedRoute`, `RoleRoute`, `GuestRoute`)
- **Frontend**: pdfcn-powered modern invoice PDF preview and export
- **Backend**: Laravel 13 REST API with Sanctum token authentication
- **Backend**: Role-Based Access Control (RBAC) — admin / manager / user with granular permissions
- **Backend**: GST tax service supporting CGST/SGST (intrastate) and IGST (interstate) calculations
- **Backend**: Auto double-entry journal posting on invoice approval, payment recording, and void/reversal
- **Backend**: Full CRUD controllers — Auth, User, Item, Product, Customer, Vendor, Account, Invoice, Payment, PurchaseOrder, SalesOrder, JournalEntry, Report, Dashboard
- **Database**: Normalized MySQL migrations — 19 migration files covering all accounting entities
- **Database**: Chart of Accounts seeder with standard GL codes
- **Realtime**: Node.js + Socket.IO broadcast microservice for live inventory and invoice events
- **Infrastructure**: Docker Compose setup for Laravel API, MySQL, and realtime service
- **Docs**: Architecture diagrams, CRUD blueprint, system documentation

---

## [0.1.0] — 2026-09-04

### Added
- Initial repository setup with root `package.json`, Docker Compose, and `setup.sh`
- Base Laravel application configuration and environment setup
- Initial database migrations for users, cache, jobs, and items tables
