# Property Portfolio Cashflow Forecaster — Functional Specifications (V1.1 draft)

**Status:** Draft for review  
**Date:** 11 Aug 2025 (AEST)  
**Owner:** Property Buyers Co. (PBCo)  
**Time zone standard:** Australia/Sydney (store UTC, display local)

---

## 1. Document control
- **Purpose:** Define the functional behaviour, data structures, APIs, UX flows, and non‑functional specs for V1 of the application, per the approved BRD.  
- **Scope:** Single‑projection portfolio cashflow modeller with Client/Admin accounts, Strategy & Property Type metadata, Loan Type (IO vs P&I), AU data residency, server‑side snapshots, exports.  
- **References:** BRD (V0.1), Strategy & Property Type Metadata — BRD Addendum (latest), Loan Type Metadata Addendum, Spreadsheet prototype(s).  
- **Approvals:** _To be completed at sign‑off._

---

## 2. Locked decisions (stakeholder)
- **Platform:** Supabase (Postgres + Auth + Row Level Security).  
- **Data residency:** AU region only.  
- **2FA:** Optional (can be enforced for Admin later).  
- **Snapshots:** Store on server by default (cloud), local export/import available.  
- **Portfolio size:** Max 10 properties (V1), one loan per property.  
- **Admin capabilities:** Admin can view **and edit all** client models, including properties/strategies/loans.  
- **Commercial behaviour:** Include **Net lease** toggle for Value‑Add Commercial.  
- **Exports:** CSV and JSON.  
- **Footer banner:** centred — “**Property Buyers Co. All rights reserved**”.  
- **Projection:** Single projection (no scenarios) per BRD.

---

## 3. Solution overview
**Problem:** Investors need a clear, personalised forecast of after‑tax net cashflow to identify the earliest year they can safely replace their income.  
**Solution:** A SaaS app that collects portfolio inputs (globals, properties, loans), computes a 30‑year projection (single path), and presents results (KPIs, table, event log) with exports, under an education‑only compliance posture.  
**Key capabilities:**  
- Strategy‑aware property inputs (Buy & Hold, Manufacture Equity, Value‑Add Commercial with Net lease).  
- Loan Type handling: Interest‑Only (IO) vs Principal & Interest (P&I) with step‑up post‑IO.  
- Year‑by‑year portfolio roll‑up with LVR, DSCR and income‑replacement year.  
- Client/Admin accounts; Admin can manage properties/loans on behalf of clients with audit trails.

**Out of scope (V1):** scenarios/stresses; progressive income tax; CGT; multi‑loan per property; serviceability/APRA; refinance; offsets/redraw; state land‑tax modules.

---

## 3.1 Solution architecture
**Component view (logical):**
- **Client (Next.js SPA)** — UI, forms, validation, local snapshot export.
- **API gateway (Next.js API routes)** — validates payloads, enforces auth, calls DB with service role when required (server-only), shapes responses.
- **Auth & Identity (Supabase Auth)** — email/password, optional TOTP 2FA; JWT for client calls; service key for server.
- **Data layer (Supabase Postgres + RLS)** — application tables (users, portfolios, properties, loans, results, consents, audit_logs) and **reference tables** (LMI, stamp duty, global defaults, cap rates, etc.).
- **Computation (Projection engine)** — pure functions in server runtime; deterministic calculations; versioned formula set.
- **Storage (Supabase Storage, optional)** — export archives if needed.
- **Observability** — app logs, error tracking; DB audit logs.

**Security boundaries:**
- Browser → API: user JWT; least-privilege; form input sanitisation & server-side validation.
- API → DB: service role only on server; RLS protects user-scoped data; Admin override via `is_admin()`.

**Key data flows:**
1. User authenticates → JWT issued.
2. Client saves/loads portfolios via API (RLS enforces ownership).
3. Admin opens client model → API reads with Admin override; actions audited.
4. Compute: API assembles inputs (globals + properties + loans + **reference data**) → runs engine → persists `results` row → returns `{yearRows, kpis, events}`.
5. Export: API streams CSV/JSON with disclaimer + centred footer.

**Versioning:**
- **Reference data** is versioned and effective-dated (state & date applicability). Compute uses the **latest effective** version unless an explicit version is selected.
- **Formula set** changes bump an engine version; results store `engine_version` for traceability.

---

## 4. Architecture & stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui.  
- **Auth/DB:** Supabase Auth + Postgres with RLS, AU region.  
- **API layer:** Next.js API routes calling Supabase (PostgREST/SDK) with service role on server; client uses user JWT.  
- **Storage:** Supabase (tables + storage for exports if needed).  
- **Observability:** Application logs, error tracking; DB logs via Supabase.  
- **Environments:** dev / stage / prod; feature flags.

**High‑level diagram (text):**  
Client (browser) ⇄ Next.js UI ⇄ Next.js API routes ⇄ Supabase (Auth, Postgres, RLS, Storage).

---

## 5. Roles, permissions & session
**Roles:**  
- **Client:** CRUD their own portfolios/properties/loans/results; export; manage profile.  
- **Admin:** CRUD all users’ portfolios/properties/loans; manage users; view audit; reset passwords; disable accounts; ownership transfer.

**RLS principles:**  
- Row ownership by `user_id`; Admin bypass via `is_admin()` helper.  
- Property/loan rows inherit permissions via portfolio_id.  
- Audit logs written for create/update/delete and **sensitive reads**.

**Session:**  
- JWT sessions (httpOnly cookies). Idle timeout 60 min (configurable). 2FA optional.

---

## 6. UX journeys & information architecture
**Primary flows:**  
1) **Onboard & consent** → create first portfolio.  
2) **Add property** (Property Type → Investment Strategy) → **Add loan** (Loan Type IO/P&I).  
3) **Run projection** → results (KPIs, table, event log) → export CSV/JSON, save snapshot.  
4) **Admin**: client directory → open profile → **add/model properties & loans** → view audit log.

**Navigation (pages/routes):**  
- `/` Dashboard (tiles, CTA).  
- `/onboarding` Wizard (Globals → Properties → Loans → Review).  
- `/portfolio/:id` Results view.  
- `/properties` CRUD list; `/loans` CRUD list (contextual to portfolio).  
- `/admin` Admin console: users, portfolios, audit; manages properties/loans on behalf.

**UX standards:**  
- Progressive disclosure; inline validation; helper text with units (e.g., “enter 0.065 for 6.5%”).  
- Accessibility (WCAG 2.1 AA): labels, keyboard, contrast.  
- Persistent disclaimer bar on results & exports.

---

## 7. Functional modules
### 7.1 Accounts & identity
- **Sign up/sign in**, password reset; optional 2FA (TOTP).  
- **Admin invites:** create user → send email link to set password.  
- **Profile:** name, email, (optional) phone.  
- **Consent:** capture non‑advice acknowledgement at first run; store in `consents`.

**Acceptance:**  
- Users can authenticate; Admin can invite/disable; consent stored and timestamped.

### 7.2 Portfolio management
- **CRUD** portfolio (name, globals, start year). Limit 10 properties.  
- **Snapshots:** server‑side save (name, timestamp, derived results), restore to current.  
- **Ownership transfer:** Admin may reassign to another user.

**Acceptance:**  
- Create/edit/delete portfolio; snapshot create/restore; audit entries generated.

### 7.3 Property management (Strategy & Type aware)
- **Selectors:** Property Type (Residential/Commercial sub‑types) → Investment Strategy:  
  - `BUY_AND_HOLD` (baseline; optional one‑off capex legacy fields).  
  - `MANUFACTURE_EQUITY`: startYearIndex, durationMonths, capexBudget, contingencyPct, downtimeWeeks, expectedRentUpliftPct|Amount, endValueOverride?, funding, capitaliseInterest.  
  - `VALUE_ADD_COMMERCIAL`: **currentNetLease** (Net lease toggle), marketRentPa, targetOccupancyPct, incentivePct, leasingDowntimeWeeks, capexProgramPa, revalueCapRate?.
- **Validations:** strategy‑specific ranges & mutual exclusivity (uplift % vs $).  
- **Admin assist:** Admin can add/edit properties, strategies, and related data on behalf of clients (audited).

**Acceptance:**  
- Conditional forms render appropriately; invalid combos blocked; changes reflected in results after recalculation.

### 7.4 Loan management
- **Loan Type:** `INTEREST_ONLY` or `PRINCIPAL_AND_INTEREST`.  
- **Fields:** initialLoan, interestRatePct, ioYears, termYears, rateStepUpPp.  
- **Rules:** if IO, `ioYears ≥ 1` and `< termYears`; if P&I, `ioYears = 0`.  
- **Admin assist:** Admin can configure loans for clients (audited).

**Acceptance:**  
- IO period produces zero‑principal years; step‑up rate applied post‑IO; validation errors are actionable.

### 7.5 Projection engine (single projection)
**Horizon:** 30 years; Year 1 = analysis start year.  
**Per‑property per‑year sequence:**
1. **Active?** if year ≥ settlement and (no sale or year ≤ sellingYear).  
2. **Value** = purchasePrice × (1 + capitalGrowth)^(years since settlement).  
3. **Loan rate** = base rate + (year>IO? rateStepUpPp : 0).  
4. **Opening balance**: initial loan first active year else prior closing.  
5. **Interest** = opening × rate.  
6. **Principal** = 0 during IO; else **PMT‑based** amort for remaining term minus interest.  
7. **Gross rent** = initialRent × (1 + rentGrowth)^(years since settlement).  
8. **Vacancy** = gross × vacancyPct; **PM fee** = (gross − vacancy) × pmFeePct.  
9. **Other costs** (other/insurance/rates) = base × (1 + expenseInflation)^(years since settlement).  
10. **Strategy effects:**  
   - *Manufacture Equity*: apply capex across duration; increase vacancy by downtimeWeeks/52 during works; apply rent uplift after completion; optional endValueOverride thereafter; if funding=loan_top_up & capitaliseInterest, add interest cost during works (no principal).  
   - *Value‑Add Commercial*: if **Net lease**, reduce owner expenses by recovered outgoings; apply leasing downtime; amortise incentives across first 12 months; ramp to target occupancy over 1–2 years (linear).  
11. **Acquisition costs** at settlement: stamp duty + LMI (cashflow only).  
12. **Sale**: if sellingYear, proceeds = Value × (1 − sellingCostsPct) − closing balance (pre‑CGT).  
13. **NOI** = rent − vacancy − PM − other − insurance − rates − capex.  
14. **Taxable** = NOI − interest − depreciation.  
15. **Tax** = max(Taxable, 0) × (marginalTax + medicare).  
16. **After‑tax CF (property)** = NOI − interest − principal − tax − acquisition + sale + (−Taxable × taxRate if Taxable<0).

**Portfolio totals per year:** sum value, loans, NOI, interest, principal, taxable, tax, after‑tax CF; **Equity** = value − loans; **LVR** = loans/value; **DSCR** = NOI/interest.  
**Income‑replacement year:** earliest year where portfolio after‑tax CF ≥ target.

**Acceptance:**  
- Reproducible numbers vs spreadsheet prototype; edge conditions handled (division guards; sale before settlement blocked at validation).

### 7.6 Results & reporting
- **KPIs:** Income‑replacement year; this‑year after‑tax CF; LVR; DSCR.  
- **Table columns:** yearLabel, netTaxableIncome, tax, afterTaxCF, interest, principal, portfolioValue, totalLoans, equity, LVR, DSCR.  
- **Event log:** settlement; IO→P&I; works/lease‑up; rent uplift; sale.  
- **Exports:**  
  - **CSV:** year‑by‑year portfolio table (add disclaimer row at end).  
  - **JSON:** complete model (inputs + computed yearly rows).  
- **Branding & footer:** centred footer “Property Buyers Co. All rights reserved”.  
- **Disclaimer:** persistent banner: “This is general information and not financial advice. Results are hypothetical and depend on the assumptions you enter.”

**Acceptance:**  
- KPIs/tables update after changes; exports include disclaimer & footer; no PII beyond user name/email in JSON header.

### 7.7 Admin console
- **Client directory:** search, filter by role/status.  
- **Client profile:** portfolios list, last login, notes, consents.  
- **Property & loan management:** Admin can add/edit/delete for client; changes audited.  
- **User management:** invite, reset password, disable/enable, transfer ownership.  
- **Audit log viewer:** who/what/when including reads of client data.
- **Reference data management:** Admin can manage the catalogues used by calculations:
  - **LMI schedules** (by LVR bands, loan size, lender class; effective-dated).
  - **Stamp duty rules** (by state/territory, price brackets, concessions; effective-dated).
  - **Global modelling defaults** (rent growth, expense inflation, capital growth presets).
  - **Commercial presets** (cap rates by asset type/region; optional).
  - **Tax presets (future)** (progressive brackets once V1.1 lands).

  Capabilities: list, search, create, edit, retire (end-date), preview impact in a sandbox, and publish. All changes audited.

**Acceptance:**  
- Admin can fully manage client models and reference catalogues; all actions logged with timestamps and actor.

---

## 8. Data model & dictionary (summary)
**Entities:**  
- **users** (id, org_id, email, name, role, 2fa_enabled, created_at)  
- **profiles** (user_id, status, notes, last_login_at)  
- **portfolios** (id, org_id, user_id, name, globals jsonb, start_year, created_at, updated_at)  
- **properties** (id, portfolio_id, data jsonb, created_at, updated_at)  
- **loans** (id, property_id, data jsonb, created_at, updated_at)  
- **results** (id, portfolio_id, scenario text='single', engine_version, year_rows jsonb, computed_at)  
- **consents** (id, user_id, version, accepted_at)  
- **audit_logs** (id, org_id, actor_user_id, action, target_type, target_id, diff jsonb, ip, user_agent, created_at)

**Reference entities:**  
- **reference_lmi** (id, lender_class, lvr_min, lvr_max, loan_min, loan_max, premium_pct, effective_from, effective_to, created_at, updated_at)  
- **reference_stamp_duty** (id, state, bracket_min, bracket_max, formula_text, first_home_flag, investor_flag, effective_from, effective_to, created_at, updated_at)  
- **reference_defaults** (id, key, value_json, description, effective_from, effective_to, created_at, updated_at)  
- **reference_cap_rates** (id, region, asset_type, cap_rate, source, effective_from, effective_to, created_at, updated_at)  
- **reference_change_log** (id, actor_user_id, ref_table, ref_id, action, diff jsonb, created_at)

**Key JSON schemas (payloads):**  
- **GlobalSettings**: { startYear, marginalTax, medicare, rentGrowth, expenseInflation, capitalGrowth, targetIncome }  
- **StrategyData** (per Addendum): Buy & Hold | Manufacture Equity | Value‑Add Commercial (with **currentNetLease**).  
- **PropertyInput**: { id, state, propertyType, strategy, purchasePrice, settlementYearIndex, initialRentPa, vacancyPct, pmFeePct, otherExpensesPa, insurancePa, ratesStrataPa, depreciationPa, landTaxPa, capexYearIndex?, capexAmount?, sellingYearIndex?, sellingCostsPct, stampDuty?, lmi? }  
- **LoanInput**: { propertyId, loanType, initialLoan, interestRatePct, ioYears, termYears, rateStepUpPp }  
- **YearRow**: { yearIndex, yearLabel, netTaxableIncome, tax, afterTaxCF, interest, principal, portfolioValue, totalLoans, equity, lvr, dscr }

---

## 9. APIs & service contracts (internal)
**Auth:** Supabase Auth routes.  
**Portfolio:**  
- `GET /api/portfolios` (own or admin all)  
- `POST /api/portfolios` (create)  
- `GET /api/portfolios/:id` (owner/admin)  
- `PATCH /api/portfolios/:id`  
- `DELETE /api/portfolios/:id`  
- `POST /api/portfolios/:id/compute` → returns `{ yearRows, kpis, events }` and stores in `results`  
- `POST /api/portfolios/:id/snapshots` → create server snapshot  

**Property:**  
- `GET /api/portfolios/:id/properties`  
- `POST /api/portfolios/:id/properties`  
- `GET /api/properties/:pid`  
- `PATCH /api/properties/:pid`  
- `DELETE /api/properties/:pid`

**Loan:**  
- `GET /api/properties/:pid/loans`  
- `POST /api/properties/:pid/loans`  
- `GET /api/loans/:lid`  
- `PATCH /api/loans/:lid`  
- `DELETE /api/loans/:lid`

**Admin:**  
- `GET /api/admin/users` (list/filter)  
- `POST /api/admin/users` (invite/create)  
- `GET /api/admin/users/:uid` (profile + portfolios)  
- `PATCH /api/admin/users/:uid` (disable/reset)  
- `GET /api/admin/audit` (filters)

**Reference data (Admin only):**  
- `GET /api/admin/reference/lmi` | `POST` | `PATCH /:id` | `DELETE /:id`  
- `GET /api/admin/reference/stamp-duty` | `POST` | `PATCH /:id` | `DELETE /:id`  
- `GET /api/admin/reference/defaults` | `POST` | `PATCH /:id` | `DELETE /:id`  
- `GET /api/admin/reference/cap-rates` | `POST` | `PATCH /:id` | `DELETE /:id`  
- `POST /api/admin/reference/preview` → dry-run compute with candidate reference set (no persistence)

Conventions: versioning via `effective_from/effective_to`; immutable history in `reference_change_log`; soft-delete by end-dating.

**Errors:** JSON `{ code, message, field? }`; 4xx validation; 403 RLS; 5xx fallback.

---

## 10. Security, privacy & compliance
- **AuthZ:** RLS policies; Admin override via `is_admin()` function.  
- **Audit:** log create/update/delete and sensitive READs with actor, IP, UA.  
- **PII minimisation:** store only essential identifiers; exclude sensitive financial IDs.  
- **Encryption:** TLS in transit; at‑rest via provider.  
- **Backups:** daily; 7/30‑day retention; restore tested.  
- **Compliance messaging:** persistent disclaimer; exports include disclaimer + footer banner.  
- **Data residency:** AU region enforced at infra & storage.

---

## 11. Non‑functional requirements
- **Performance:** compute 10 properties × 30 years in ≤ 1s on mid‑range laptop.  
- **Availability:** target 99.5% (V1); maintenance windows communicated.  
- **Accessibility:** WCAG 2.1 AA essentials.  
- **Browser support:** last 2 versions of Chrome/Edge/Safari; iOS Safari 15+.  
- **Observability:** structured server logs; error tracking; DB query logs for admin actions.

---

## 12. Testing & acceptance
- **Unit tests**: calc engine, validators.  
- **Integration tests**: RLS access, API contracts.  
- **E2E tests**: wizard to results, admin edit‑on‑behalf, exports, snapshots.  
- **A11y checks**: axe on key pages.  
- **UAT**: seeded portfolio: 3 properties with mixed strategies; benchmark against spreadsheet.

**Exit criteria:**  
- All acceptance tests pass; KPIs compute correctly vs reference; disclaimer/footer present on results and exports; audit logs complete.

---

## 13. Release plan & environments
- **Envs:** dev (feature flags), stage (UAT), prod.  
- **Deploy:** CI/CD with DB migrations; rollback: previous image + migration down.  
- **Data migration:** spreadsheet importer (CSV) → properties/loans/globals; local snapshot → cloud.

---

## 14. Risks, assumptions & decisions
- **Risks:** misinterpretation as advice (mitigate via banners/copy); data privacy (RLS + audits); scope creep (hold V1 line).  
- **Assumptions:** one loan per property; simplified tax; no CGT.  
- **Decisions log:** maintained in repo (README or /docs/decisions.md).

---

## 15. Appendices
- **Glossary:** After‑tax CF, LVR, DSCR, IO, Net lease, NOI, PM fee, etc.  
- **Calculation pseudo‑code:** kept alongside engine with unit tests.  
- **Wireframes:** onboarding, property form (strategy variants), results, admin console.  
- **ERD:** Users ↔ Profiles ↔ Portfolios ↔ Properties ↔ Loans; Portfolios ↔ Results; Users ↔ Consents; Users ↔ AuditLogs; **Reference** tables linked logically to compute but not to user ownership.

