# Architecture & Implementation Decisions

| Date | Area | Decision | Rationale |
| :--- | :--- | :--- | :--- |
| 2026-10-13 | Architecture | Monorepo with pnpm workspaces + Turborepo | Enables unified TypeScript types across apps (`web`, `admin`, `api`) and atomic versioning. |
| 2026-10-13 | Currency | Integer Halalas (1 SAR = 100 Halalas) | Floating-point inaccuracies lead to severe financial reconciliation errors. |
| 2026-10-13 | Tax & Invoicing | 15% ZATCA VAT abstraction with `InvoiceService` | Keeps ZATCA Fatoora Phase 2 pluggable without blocking initial deployment. |
| 2026-10-13 | Search | Alphanumeric normalization + `pg_trgm` | Strips whitespace, hyphens, slashes and normalizes Arabic numerals for reliable spare part lookups. |
| 2026-10-13 | Concurrency | Row-level locking & Redis locks during checkout | Eliminates overselling under concurrent checkouts for low-stock items. |
| 2026-10-13 | Payments | `MockPaymentProvider` locally + Tap Payments in staging | Enables offline and automated test runs while keeping gateway adapters clean. |
| 2026-10-13 | Design | Shop (Shopify) style reference tokens | Pure white canvas, 28px radii, 20px inner image radii, and Shop Violet `#5433eb` accent. |
