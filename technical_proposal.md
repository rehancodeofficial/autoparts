# Technical Proposal — Automotive Spare Parts E-Commerce & Vehicle Fitment Platform

**Date:** Oct 13, 2026  
**Author / Lead:** @Shakeel Hussain  
**Target Market:** Kingdom of Saudi Arabia (KSA)  

---

## 1. Executive Summary

We propose to build a modern, high-performance, Saudi-focused automotive spare parts e-commerce platform where customers can easily find the exact part for their vehicle, check live warehouse stock, and complete secure online purchases using local payment methods (**mada**, **Apple Pay**, **Visa/Mastercard**, **STC Pay**, and **Tamara/Tabby**).

The first release (**MVP**) is planned at **8–14 weeks** for one full-stack developer (expandable to two developers to compress timeline), initiated once core catalog data and merchant provider credentials are established.

### Core Pillars
1. **Customer Web Application:** Arabic (RTL) & English, mobile-first, ultra-responsive storefront featuring part-number search, category browsing, and a Make → Model → Year vehicle compatibility selector.
2. **Operations & Admin Dashboard:** Central management console for automotive catalog data, vehicle fitment mappings, inventory/stock per location, order processing, refunds, courier tracking, and audit logging.
3. **Backend & Integration Engine:** Robust API architecture built on **Next.js / Node.js (NestJS)** and **PostgreSQL**, connected to top-tier Saudi payment gateways (e.g. Tap Payments or HyperPay) and local logistics couriers.

> **Key Focus:** Exact part-number search with reliable vehicle compatibility is the heart of the product. The system is engineered to handle normalized SKU/OEM lookup, cross-referencing, and multi-parameter fitment checks to prevent costly return cycles.

---

## 2. Project Scope & Phasing

This proposal covers a **single-merchant platform** (one entity managing their own inventory, shipping, and receiving customer payments). Multi-vendor marketplace support is isolated for future scaling.

| Area | MVP (Phase 1 — Launch Ready) | Phase 2 (Post-Launch Enhancements) |
| :--- | :--- | :--- |
| **Search & Discovery** | Part number (normalized), OEM cross-referencing, Part name, Make / Model / Year hierarchy, Category & Brand faceted filters | VIN (Chassis Number) decoding & lookup, automated AI cross-reference matching |
| **Catalog** | Structured automotive catalog, multi-angle images, OEM & aftermarket parts, specifications, fitment matrix, tiered prices | Direct supplier / ERP catalog automatic synchronization (XML/JSON feeds, SAP/Odoo) |
| **Inventory** | Real-time stock per SKU, warehouse bin location, low-stock thresholds, short-window reservation on checkout | Multi-warehouse routing, direct supplier dropshipping stock feeds |
| **Checkout & Payments** | Guest & account checkout, Saudi address validation, ZATCA-compliant VAT breakdown, mada, Apple Pay, Cards, STC Pay, Tamara | Tabby integration, wallet credits, corporate invoicing (B2B net terms) |
| **Orders & Shipping** | Complete order lifecycle management, payment validation, manual & API courier tracking link generation | Automated airway bill (AWB) generation, reverse logistics / return shipping labels |
| **Customer Portal** | Self-serve dashboard, order history, downloadable PDF invoices, shipment tracking, return/refund ticket submission | Verified product reviews, loyalty points & referral incentives |
| **Localization** | Native Arabic (RTL) and English, Saudi Riyal (SAR) default | GCC multi-currency and cross-border customs support |
| **Reporting & Admin** | Revenue metrics, best-selling SKUs, stock valuation, failed transaction logs, return/refund auditing | Demand forecasting, dead-stock alert algorithms, cohort retention metrics |

---

## 3. Proposed Solution Architecture

### 3.1 Customer Website
- **Vehicle Selector ("Garage"):** Select Make → Model → Year (and engine/trim where available). Remembers the customer's selected vehicle across sessions to tag products as *“Compatible with your vehicle”* or *“Does not fit”*.
- **Intelligent Search Engine:** Instant autocomplete, typo handling, and multi-field matching (Part Name, Brand, OEM, SKU, and Alternate Part Numbers).
- **Product Detail Page (PDP):** Clear compatibility badge, technical attributes (dimensions, side/position, engine code), high-resolution imagery, stock indicator, delivery timeframe estimate, and warranty/return terms.
- **Cart & Checkout:** Transparent checkout displaying item subtotal, shipping fees, applied coupon discounts, and **15% ZATCA VAT**. Mobile-optimized for seamless Apple Pay sheet invocation.

### 3.2 Exact Part-Number Search Logic
Automotive spare parts depend on precise alphanumeric matches:
1. **Input Normalization:** Strips white spaces, hyphens, slashes, periods, and standardizes casing (e.g., `OEM-12345`, `oem 12345`, and `OEM12345` resolve identically).
2. **Hierarchy Resolution:** Direct match against primary SKU $\rightarrow$ OEM Cross-reference lookup $\rightarrow$ Approved Aftermarket equivalent lookup.
3. **Fitment Filtering:** If an active vehicle is selected, flags matching parts according to vehicle engine/production month rules.
4. **Fallback Flow:** In case of no direct match, suggests close alternatives and surfaces an interactive **"Request a Part"** form that routes directly to sales/procurement agents.

### 3.3 Admin Dashboard
- **Catalog Management:** Bulk CSV/Excel importer for mass uploading thousands of part numbers, specifications, and fitment relations.
- **Inventory Control:** Stock adjustments, audit trails per technician/staff member, low-stock notices, and reservation releases.
- **Order Fulfilment:** Transition orders through stages: `Pending Payment` $\rightarrow$ `Paid` $\rightarrow$ `Processing/Packing` $\rightarrow$ `Dispatched` $\rightarrow$ `Delivered` (or `Cancelled/Refunded`).
- **Financial & Audit Tools:** One-click refund triggers via gateway API, dispute inspection, and action audit logs for sensitive changes.

---

## 4. Technical Architecture & Stack

```
   [ Customer Web App ]          [ Admin Dashboard ]
   (Next.js / SSR / RTL)         (React / Vite / TS)
            \                            /
             \                          /
        HTTPS \                        / HTTPS
               v                      v
         +----------------------------------+
         |      Node.js API (NestJS)        |
         |  - Auth & RBAC   - Search Engine |
         |  - Order Logic   - Payment Hooks |
         +----------------------------------+
               |            |            |
       +-------+            |            +-------+
       |                    |                    |
       v                    v                    v
+--------------+    +---------------+    +----------------+
|  PostgreSQL  |    |  Redis Cache  |    | Cloud Storage  |
|  (Core DB)   |    | (Queue/Locks) |    |  (S3-Compat)   |
+--------------+    +---------------+    +----------------+
       ^
       |-- Background Workers (BullMQ) -> [ Email / SMS / WhatsApp API ]
       |-- Payment Gateway Webhooks   <-  [ Tap Payments / HyperPay ]
       |-- Logistics Integration      <-> [ SMSA / Aramex / Oto API ]
```

### Stack Breakdown
- **Frontend (Storefront):** Next.js (React 19 / TypeScript, SSR for SEO, TailwindCSS / Vanilla CSS with RTL switch).
- **Frontend (Admin):** React + TypeScript (Single Page App for rapid, stateful operations).
- **Backend API:** Node.js using NestJS (Modular architecture, TypeScript, class-validator, OpenAPI/Swagger docs).
- **Database:** PostgreSQL (with indexed text search, JSONB for dynamic part specifications, strict foreign key constraints).
- **Caching & Concurrency:** Redis (idempotency keys, rate-limiting, temporary checkout inventory reservations via Redis locks).
- **File & Media Storage:** S3-compatible cloud bucket (optimized WebP product images, generated PDF invoices).
- **DevOps & Infra:** Docker containers, GitHub Actions CI/CD, Staging & Production environments, automated database snapshots.

---

## 5. Order & Payment Lifecycle

```
[Customer Checkout] ---> [Reserve Stock in DB / Redis] ---> [Initiate Gateway Session]
                                                                     |
                                                                     v
                                                          [Customer Pays (mada/Apple Pay)]
                                                                     |
                                                                     v
[Order Marked 'Paid'] <--- [Verify Cryptographic Signature] <--- [Webhook from Gateway]
         |
         +---> [Generate ZATCA Invoice PDF]
         +---> [Send SMS / Email Confirmation]
         +---> [Push Order to Fulfillment Queue]
```

### Critical Resiliency & Edge-Case Handling
- **Double-Click & Refresh Idempotency:** Payment initiation endpoints utilize unique UUID idempotency keys to guarantee a customer is never double-charged.
- **Race Condition Prevention:** Database row-level locks (`SELECT ... FOR UPDATE`) prevent two users from buying the last remaining spare part simultaneously.
- **Uncompleted Payments:** Reserved stock is automatically released after a 15-minute expiration timer if payment is abandoned.
- **Missed Webhook Reconciliation:** A scheduled cron job queries the payment gateway API for any orders lingering in `Pending` state for over 30 minutes to reconcile state discrepancies.

---

## 6. Saudi Payment Gateway Strategy

To deliver an exceptional checkout experience in Saudi Arabia, **mada** and **Apple Pay** are prioritized as mission-critical.

| Provider | Supported Methods | Strengths / Fit |
| :--- | :--- | :--- |
| **Tap Payments** *(Recommended)* | mada, Apple Pay, Visa/Mastercard, STC Pay | Unified modern REST API, clean mobile checkout SDK, rapid merchant onboarding in KSA |
| **HyperPay** | mada, Apple Pay, Visa/MC, STC Pay, Tamara | Extensive local presence in Saudi banking ecosystem, ideal for high-volume transactions |
| **PayTabs** | mada, Apple Pay, Credit Cards, STC Pay | Established regional provider with turnkey shopping cart plugins and invoicing support |
| **Buy Now Pay Later** | Tamara / Tabby | Boosts average order value (AOV) for expensive automotive parts (transmissions, turbos, body kits) |

*The final selection is confirmed during the Discovery Phase based on the client's commercial entity documentation and fee negotiation.*

---

## 7. Security, Quality Assurance & Compliance

- **Security & Data Integrity:**
  - Password hashing via Argon2 / bcrypt.
  - Role-Based Access Control (RBAC) separating warehouse pickers, customer support, and financial admins.
  - Zero Card Data Retention: All card data stays strictly within PCI-DSS certified payment gateway iframes/sheets.
  - OWASP Top 10 mitigation: Parameterized SQL queries, sanitization against XSS, CORS lockdown, and strict rate limiting on public search/auth endpoints.
- **ZATCA Compliance Readiness:**
  - Invoices structured with standard Saudi Tax requirements (Supplier Name, Tax Registration Number, Timestamps, Itemized VAT 15%, QR code support).
- **Quality Assurance & Testing:**
  - Automated unit and integration test coverage for order calculations, coupon validation, stock deductions, and webhook signature verification.
  - Staging environment mirrored with gateway sandbox for realistic client acceptance testing.

---

## 8. Delivery Plan, Milestones & Timeline

The MVP is structured into **6 sequential phases** over **8 to 14 calendar weeks** for a single dedicated full-stack developer:

```
[Phase 1: Discovery & Tech Architecture] ---- 1-2 Weeks ----> [Sign-off Gate 1]
[Phase 2: Storefront UI & Catalog UX] ------- 2-3 Weeks ----> [Sign-off Gate 2]
[Phase 3: Backend, Inventory & Search] ------ 2-4 Weeks ----> [Sign-off Gate 3]
[Phase 4: Checkout & Payment Integration] --- 1-3 Weeks ----> [Sign-off Gate 4]
[Phase 5: Logistics & Order Management] ----- 1-2 Weeks ----> Internal Testing
[Phase 6: UAT, Hardening & Go-Live] --------- 1-2 Weeks ----> Final Sign-off & Launch
```

### Detailed Milestone Breakdown

| Phase | Duration | Scope & Deliverables | Sign-Off Gate |
| :---: | :---: | :--- | :--- |
| **1** | Weeks 1–2 | **Discovery & Architecture:** Database schema finalization, UI wireframes, gateway/courier account setup, fitment data format definition. | **Gate 1:** Architecture & Schema approval |
| **2** | Weeks 3–5 | **Storefront UI & Catalog:** Arabic (RTL) / English responsive layouts, vehicle selector widget, product catalog browse, category trees. | **Gate 2:** UI/UX & Navigation acceptance |
| **3** | Weeks 6–9 | **Core Backend & Search:** Normalized part-number search engine, vehicle compatibility matcher, admin dashboard catalog/stock tools, bulk CSV import. | **Gate 3:** Search & Admin CRUD acceptance |
| **4** | Weeks 10–12 | **Cart, Checkout & Payments:** Cart calculation, ZATCA VAT, Saudi payment gateway integration (mada, Apple Pay, cards), webhooks & refund flows. | **Gate 4:** End-to-end sandbox payment approval |
| **5** | Weeks 12–13 | **Fulfillment & Logistics:** Order processing workflow, invoice generator, courier tracking linking, SMS/Email order status notifications. | Internal QA Review |
| **6** | Weeks 13–14 | **Testing, Security & Go-Live:** Stress testing, payment reconciliation tests, data import of real client stock, production deployment, DNS cutover. | **Final Gate:** Go-Live approval & Handover |

---

## 9. Assumptions, Dependencies & Client Responsibilities

For the project to adhere to the estimated timeline, the following dependencies must be fulfilled:
1. **Catalog & Fitment Data:** The client provides clean product data (part numbers, OEM equivalents, prices, vehicle compatibility tables) in structured format (Excel, CSV, or API access).
2. **Payment Gateway Merchant Account:** Timely provision of approved commercial register (CR / السجل التجاري) to secure sandbox and production gateway keys.
3. **Logistics Courier Agreement:** Active account with chosen courier (e.g., SMSA, Aramex, Oto, or Torod) for shipment tracking credentials.
4. **Timely Review & Gate Sign-off:** Sign-offs on milestone deliverables within 3–4 business days to maintain continuous sprint velocity.

---

## 10. Commercials & Next Steps

### Team Composition
- **Lead Full-Stack Engineer:** Architecture, Backend APIs, Search Engine, Payment & Logistics integrations.
- **UI/UX & Frontend Specialist (Optional add-on):** Can accelerate delivery from 14 weeks down to 8–10 weeks.

### Immediate Action Items
1. **Approve Scope:** Confirm MVP scope and technical selections detailed in this proposal.
2. **Kickoff Discovery Call:** Schedule technical alignment session to review initial parts database and merchant account credentials.
3. **Sprint 0 Start:** Establish project repository, staging environment, and shared task tracking board.

---

*Prepared by: **Shakeel Hussain** — Solutions Architect / Lead Engineer*  
*For questions and commercial discussions, please reach out directly.*
