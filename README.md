# LTO-OCR Extractor

Internal tool for VSO Company that extracts vehicle and owner data from Philippine LTO OR/CR documents and generates pre-filled Annex-C (Stand-Alone Private Car Policy) PDFs.

## Live

- **App:** https://lto-ocr-extractor.vercel.app
- **GitHub:** https://github.com/Scarlet-Ghost/lto-ocr-extractor
- **Supabase:** https://supabase.com/dashboard/project/bwyyoslwskmvwppnyaus

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 |
| OCR/AI | Google Gemini Flash 2.0 |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage (private buckets) |
| PDF Generation | pdf-lib |
| Hosting | Vercel |

## Features

- Upload JPEG, PNG, or PDF scans of Philippine OR/CR documents
- AI-powered extraction of 15 fields with per-field confidence scoring (0-100%)
- Multi-document support (upload OR and CR separately or combined)
- Human review screen with editable fields and confidence badges
- Document carousel preview (navigate between uploaded documents)
- Pre-filled Annex-C PDF generation matching official template layout
- Extraction history with search and pagination

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── extract/route.ts        # Gemini extraction endpoint
│   │   ├── extractions/route.ts    # CRUD list + create
│   │   ├── extractions/[id]/route.ts  # CRUD get + update
│   │   ├── generate-pdf/route.ts   # Annex-C PDF generation
│   │   ├── storage/proxy/route.ts  # Supabase storage proxy (CORS)
│   │   ├── storage/signed-url/route.ts
│   │   └── upload/route.ts         # File upload to Supabase Storage
│   ├── history/page.tsx            # Extraction history page
│   ├── review/[id]/page.tsx        # Review & edit extraction
│   ├── page.tsx                    # Upload page (home)
│   └── layout.tsx                  # Root layout with nav
├── components/
│   ├── audit-banner.tsx            # Warning banner for low confidence
│   ├── confidence-badge.tsx        # Green/yellow/red confidence indicator
│   ├── extraction-form.tsx         # Editable extraction fields
│   ├── history-table.tsx           # Paginated extraction list
│   ├── nav.tsx                     # Top navigation bar
│   ├── pdf-image.tsx               # PDF/image preview (iframe-based)
│   └── upload-zone.tsx             # Drag-and-drop upload area
├── lib/
│   ├── extraction-prompt.ts        # Gemini system prompt (extraction rules)
│   ├── gemini.ts                   # Gemini Flash 2.0 client wrapper
│   ├── pdf-generator.ts            # Annex-C PDF overlay with calibrated coords
│   ├── supabase/client.ts          # Browser Supabase client
│   ├── supabase/server.ts          # Server Supabase admin client
│   ├── types.ts                    # TypeScript interfaces
│   └── validators.ts               # File type/size validation
└── styles/
    └── globals.css                 # Tailwind + design tokens
```

## Extracted Fields

| # | Field | Source | Notes |
|---|-------|--------|-------|
| 1 | Insured Name | CR | Owner's full name, uppercase |
| 2 | Insured Address | CR | Concatenated full address |
| 3 | MV File No | CR | Motor Vehicle file number |
| 4 | Plate No | OR/CR | License plate (or conduction sticker if pending) |
| 5 | Conduction Sticker | OR/CR | Fallback if plate is pending |
| 6 | Make | CR | Vehicle brand/manufacturer |
| 7 | Model/Series | CR | Vehicle model from SERIES field |
| 8 | Year Model | CR | Manufacture year |
| 9 | Type of Body | CR | SEDAN, SUV, VAN, TRUCK, etc. |
| 10 | Serial/Chassis No | CR | Exact characters preserved |
| 11 | Motor No | CR | Exact characters preserved |
| 12 | Authorized Capacity | CR | Passenger seating capacity |
| 13 | Unladen Weight | CR | Net weight in kg |
| 14 | Color | OR | Vehicle color |
| 15 | Registration Date | OR | Converted to YYYY-MM-DD |

## PDF Coordinate Map (Annex-C Template)

Template page: **608.4 x 928.56 points** (origin: bottom-left)

| Field | X | Y | Size |
|-------|---|---|------|
| Insured Name | 38 | 768 | 9 bold |
| Insured Address | 38 | 756 | 7.5 |
| Model/Series | 35 | 696 | 7 |
| Make | 135 | 696 | 7 |
| Type of Body | 265 | 696 | 7 |
| Color | 385 | 696 | 7 |
| MV File No | 485 | 696 | 6 |
| Plate No | 35 | 677 | 7 |
| Serial/Chassis No | 135 | 677 | 6 |
| Motor No | 268 | 677 | 6 |
| Authorized Capacity | 410 | 677 | 7 |
| Unladen Weight | 508 | 677 | 6.5 |
| Limit of Liability | 435 | 657 | 9 bold |

## Supabase Schema

```sql
CREATE TABLE extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  original_file_url TEXT,
  original_file_type TEXT,
  insured_name TEXT NOT NULL,
  insured_address TEXT NOT NULL,
  mv_file_no TEXT,
  plate_no TEXT,
  conduction_sticker TEXT,
  make TEXT NOT NULL,
  model_series TEXT NOT NULL,
  year_model TEXT,
  type_of_body TEXT,
  serial_chassis_no TEXT NOT NULL,
  motor_no TEXT NOT NULL,
  capacity TEXT,
  unladen_weight TEXT,
  color TEXT,
  registration_date TEXT,
  confidence_scores JSONB DEFAULT '{}',
  audit_flags JSONB DEFAULT '{}',
  pdf_url TEXT,
  status TEXT DEFAULT 'draft'
);

CREATE INDEX idx_extractions_created_at ON extractions (created_at DESC);
CREATE INDEX idx_extractions_insured_name ON extractions (insured_name);
CREATE INDEX idx_extractions_plate_no ON extractions (plate_no);
```

**Storage Buckets** (private):
- `orcr-documents` — uploaded OR/CR scans
- `generated-pdfs` — generated Annex-C PDFs

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Gemini
GEMINI_API_KEY=AI...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Development

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # Production build
pnpm lint       # ESLint
```

## Deployment

Deployed on Vercel. Push to `main` on Scarlet-Ghost/lto-ocr-extractor triggers auto-deploy (once Git is connected in Vercel settings).

Manual deploy:
```bash
npx vercel --prod
```

## Design System

| Token | Value |
|-------|-------|
| Primary | #1E40AF (blue) |
| Secondary | #0F766E (teal) |
| Accent | #F59E0B (amber) |
| Font | Inter |
| Border Radius | 8px |
| Confidence High | green (90-100%) |
| Confidence Medium | yellow (70-89%) |
| Confidence Low | red (<70%) |
