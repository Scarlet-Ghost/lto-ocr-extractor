# Phase 2: Quote-to-Policy MVP

## Overview

Extend the LTO-OCR Extractor into a full insurance quoting and policy issuance system. After OCR extraction, VSO/JV users calculate premiums, generate quotes, send to customers for approval, and issue policies upon approval.

---

## User Roles

| Role | Who | Can do |
|------|-----|--------|
| **Admin (VSO/JV)** | Insurance agent/broker | Everything: extract, quote, issue, monitor |
| **Customer** | Vehicle owner | View quote, approve/reject, download policy |

> MVP: No auth for admin (current behavior). Customer access via shareable token links.

---

## Flow

```
1. Upload OR/CR → OCR extraction (EXISTING)
2. Review extracted data (EXISTING)
3. Vehicle valuation → SRP lookup + depreciation calc (NEW)
4. Premium calculation → industry rates + manual override (NEW)
5. Generate quote → preview with full breakdown (NEW)
6. Send quote → shareable link to customer (NEW)
7. Customer approves → notification to VSO (NEW)
8. Issue policy → generate Annex-C with premium values (NEW)
9. VSO Dashboard → monitor all quotes/policies (NEW)
```

---

## Screen-by-Screen Spec

### Screen 1: Valuation & Premium Calculator
**Route:** `/review/[id]` (extend existing review page with new tab/section)

After extraction review, user proceeds to valuation:

**Vehicle Valuation Section:**
- SRP Lookup: searchable dropdown by Make + Model + Year
  - Pre-loaded table of common Philippine vehicle SRPs
  - Manual SRP input (override) always available
- Depreciation calculator:
  - Formula: `FMV = SRP × (1 - 0.20)^age`
  - Age = current year - year_model
  - Shows: SRP → depreciation % → Fair Market Value
- Sum Insured: defaults to FMV, editable by VSO

**Premium Calculation Section:**
- Auto-calculated from sum insured using industry rates
- Editable fields (VSO override):
  - Premium rate (%) — default based on vehicle type
  - Basic premium = Sum Insured × rate
  - CTPL premium (fixed, based on Insurance Commission schedule)
  - Documentary stamps
  - VAT (12% of premium)
  - Local Gov't Tax
  - Total Amount Due
- "Generate Quote" button

### Screen 2: Quote Preview
**Route:** `/quote/[id]/preview`

Full quote summary before sending:
- Vehicle details (from OCR)
- Valuation breakdown (SRP → depreciation → FMV)
- Premium breakdown (all line items)
- Coverage summary (CTPL Section I/II, P100,000 limit)
- Policy period (FROM 12:00 Noon — TO 12:00 Noon, 1 year)
- Total Amount Due (highlighted)
- Actions: "Send to Customer" / "Edit" / "Download Quote PDF"

### Screen 3: Customer Quote Page
**Route:** `/q/[token]` (short, shareable URL)

What the customer sees:
- Company branding (VSO)
- Vehicle summary (make, model, plate, year)
- Coverage details
- Premium breakdown
- Total Amount Due
- "Approve Quote" button (big, primary)
- "Request Changes" button (secondary — sends note to VSO)
- Quote validity/expiry date
- No login required — token-based access

### Screen 4: VSO Dashboard
**Route:** `/dashboard`

Overview of all quotes and policies:

**Stats bar:**
- Total quotes | Pending approval | Approved | Issued | Expired

**Table:**
| Customer | Vehicle | Sum Insured | Premium | Status | Date | Actions |
|----------|---------|-------------|---------|--------|------|---------|

**Statuses:**
- `draft` — valuation started, not sent
- `quoted` — sent to customer, awaiting response
- `viewed` — customer opened the link
- `approved` — customer approved
- `issued` — policy PDF generated
- `expired` — quote expired (>7 days without approval)
- `rejected` — customer requested changes

**Filters:** status, date range, search by name/plate

**Actions per row:**
- View details
- Resend quote link
- Issue policy (if approved)
- Download PDF

---

## Vehicle SRP Database

### Data Model
```
vehicle_srps
├── id
├── make (e.g., "Toyota", "BYD", "Isuzu")
├── model (e.g., "Vios", "Emax 9 Premium", "Forward")
├── year_from, year_to (model year range)
├── variant (optional, e.g., "1.5 G CVT")
├── body_type (sedan, suv, van, truck, etc.)
├── srp (in PHP, e.g., 1200000.00)
├── source (e.g., "dealer_price_2025", "manual_entry")
├── created_at, updated_at
```

### Seeded Data
Pre-load top 50 most common vehicles in PH market:
- Toyota (Vios, Fortuner, Hilux, Innova, Wigo, Rush, Raize)
- Mitsubishi (Mirage, Xpander, Montero Sport, Strada)
- Honda (City, Civic, CR-V, BR-V)
- Nissan (Navara, Terra, Almera)
- Suzuki (Ertiga, Celerio, Swift, Dzire, Jimny)
- Hyundai (Accent, Tucson, Creta, Stargazer)
- Ford (Ranger, Territory, Everest)
- Isuzu (D-Max, mu-X, Traviz, Forward)
- BYD (Atto 3, Dolphin, Seal, Emax 9)
- Geely (Coolray, Emgrand, Azkarra)
- Chery (Tiggo 2 Pro, Tiggo 7 Pro, Tiggo 8 Pro)
- MG (ZS, HS, 5)
- GWM (Haval Jolion, H6)

VSO can always add/edit entries.

---

## Premium Calculation Logic

### Depreciation
```
vehicle_age = current_year - year_model
depreciation_rate = 0.20  // 20% per year (standard PH insurance)
fmv = srp * (1 - depreciation_rate) ^ vehicle_age

// Cap: minimum FMV = 20% of SRP (floor after heavy depreciation)
fmv = max(fmv, srp * 0.20)
```

### Premium Rates (Industry Standard — Editable)
```
CTPL Premium (Section I/II):
  - Private car/SUV/van: ~P560 - P610
  - Light truck: ~P610 - P900
  - (Based on Insurance Commission schedule)

Comprehensive/Acts of Nature (if applicable):
  - Rate: 1.5% - 3.0% of sum insured (varies by vehicle type/age)
  - Default: 2.0% for private cars

For Annex-C (CTPL only / Stand-Alone):
  - Fixed premium per Insurance Commission schedule
  - Sum insured for the policy = P100,000 (CTPL limit)
  - BUT vehicle FMV matters for comprehensive add-ons
```

### Tax Computation
```
basic_premium = [from rate table or manual input]
documentary_stamps = basic_premium * 0.125   // 12.5% DST
vat = basic_premium * 0.12                   // 12% VAT
local_gov_tax = basic_premium * 0.0075       // 0.75% LGT
total_amount_due = basic_premium + documentary_stamps + vat + local_gov_tax
```

### Override Rules
- VSO can override ANY calculated value
- Override is flagged in the system (audit trail)
- Original calculated value is preserved for reference

---

## Database Changes

### New Table: `quotes`
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_id UUID REFERENCES extractions(id),

  -- Vehicle valuation
  vehicle_srp NUMERIC(12,2),
  srp_source TEXT,              -- 'lookup', 'manual'
  depreciation_years INTEGER,
  depreciation_rate NUMERIC(5,4) DEFAULT 0.2000,
  fair_market_value NUMERIC(12,2),
  sum_insured NUMERIC(12,2),
  sum_insured_override BOOLEAN DEFAULT false,

  -- Premium calculation
  premium_rate NUMERIC(6,4),
  basic_premium NUMERIC(12,2),
  ctpl_premium NUMERIC(12,2),
  documentary_stamps NUMERIC(12,2),
  vat NUMERIC(12,2),
  local_gov_tax NUMERIC(12,2),
  total_amount_due NUMERIC(12,2),
  premium_override BOOLEAN DEFAULT false,

  -- Policy details
  policy_number TEXT,           -- generated on issuance
  policy_period_from DATE,
  policy_period_to DATE,

  -- Customer info
  customer_email TEXT,
  customer_phone TEXT,

  -- Quote sharing
  quote_token TEXT UNIQUE,      -- for shareable link /q/[token]

  -- Status tracking
  status TEXT DEFAULT 'draft',  -- draft/quoted/viewed/approved/issued/expired/rejected
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  customer_note TEXT,           -- if they request changes

  -- Metadata
  created_by TEXT,              -- VSO user (future auth)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_token ON quotes(quote_token);
CREATE INDEX idx_quotes_extraction ON quotes(extraction_id);
```

### New Table: `vehicle_srps`
```sql
CREATE TABLE vehicle_srps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year_from INTEGER,
  year_to INTEGER,
  variant TEXT,
  body_type TEXT,
  srp NUMERIC(12,2) NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_srps_make_model ON vehicle_srps(make, model);
```

---

## API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/vehicle-srps?make=X&model=Y` | Search SRP database |
| POST | `/api/vehicle-srps` | Add/edit SRP entry (VSO) |
| POST | `/api/quotes` | Create quote from extraction |
| GET | `/api/quotes` | List all quotes (dashboard) |
| GET | `/api/quotes/[id]` | Get quote details |
| PATCH | `/api/quotes/[id]` | Update quote (valuation, premium, status) |
| GET | `/api/quotes/token/[token]` | Customer view (public, no auth) |
| POST | `/api/quotes/[id]/send` | Send quote to customer (email/SMS) |
| POST | `/api/quotes/[id]/approve` | Customer approves |
| POST | `/api/quotes/[id]/issue` | Issue policy, generate PDF |

---

## Implementation Phases

### Phase 2A: Core Quote Flow (Build First)
1. `vehicle_srps` table + seed data (top 50 PH vehicles)
2. `quotes` table
3. Valuation UI (SRP lookup + depreciation calc)
4. Premium calculator UI
5. Quote preview page
6. "Generate Quote" saves to DB

### Phase 2B: Customer Sharing
7. Shareable link (`/q/[token]`)
8. Customer quote view page
9. Approve/reject flow
10. Status tracking (viewed_at, approved_at)
11. Quote expiry logic (7-day default)

### Phase 2C: Dashboard & Policy Issuance
12. VSO Dashboard page
13. Status filters and search
14. Issue policy flow (after approval)
15. Generate Annex-C with premium values filled in
16. Policy PDF download

### Phase 2D: Notifications (Optional for MVP)
17. Email notification when quote is sent
18. Email notification when customer approves
19. Email notification when quote expires

---

## Updated Annex-C PDF Fields

New fields to fill on the Annex-C template (in addition to existing):
- POLICY NO. → generated policy number
- DATE ISSUED → issuance date
- OFFICIAL RECEIPT NO. → from MV File No or manual
- PERIOD OF INSURANCE → FROM date / TO date
- PREMIUM PAID → total premium amount
- Section I/II amounts → documentary stamps, VAT, LGT, total

---

## Open Questions

1. **Policy numbering** — What format? (e.g., "VSO-2026-00001"?)
2. **Quote validity** — 7 days default OK?
3. **Email sending** — Use Resend, SendGrid, or skip email for MVP and just copy/share the link?
4. **Multiple coverage types** — Is Annex-C (CTPL only) the only product for now, or also comprehensive?
