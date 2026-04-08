# 💧 FacilityH2O — Water Chemistry Portal

A secure, multi-facility water chemistry tracking portal for FacilityH2O Inc.

## Quick Start

```bash
cd C:\Users\antoi\.openclaw\workspace\facilityh2o
npm install
npm run dev
```

Open: http://localhost:3000

## Login Credentials

| Username | Password | Role | Access |
|---|---|---|---|
| `ariley` | `51351853` | Admin | All 10 facilities |
| `op_whc` | `WHC2026!` | Operator | Washington Medical Center |
| `op_harbor` | `Harbor2026!` | Operator | Jefferson Memorial Hospital |
| `op_somd` | `SoMD2026!` | Operator | Lincoln Health Pavilion |
| `op_geo` | `Geo2026!` | Operator | Adams Regional Medical |
| `op_mont` | `Mont2026!` | Operator | Madison Community Hospital |
| `op_frank` | `Frank2026!` | Operator | Monroe General Hospital |
| `op_gs` | `GS2026!` | Operator | Jackson Memorial Center |
| `op_union` | `Union2026!` | Operator | Polk Health System |
| `op_stm` | `StM2026!` | Operator | Tyler Medical Institute |
| `op_nrh` | `NRH2026!` | Operator | Harrison Rehabilitation Center |

## Features

- **Secure login** — role-based (admin vs operator)
- **Data isolation** — operators only see their own facility
- **New Entry** — boiler or chilled water, per shift, live color validation
- **History** — filterable table with expandable rows, CSV export
- **Trends** — Recharts line charts with min/max reference lines
- **Alerts** — out-of-range tracking with acknowledge workflow (admin only)
- **Reports** — system-wide compliance summary (admin only)

## Data

Sample data is pre-seeded in `data/entries.json` and `data/alerts.json`.
All new entries save to these files and persist between restarts.

## Environment Variables (Optional)

Copy `.env.example` to `.env.local` to enable email alerts:

```
RESEND_API_KEY=your_resend_api_key
ALERT_EMAIL_TO=antoine.riley@facilityh2o.com
ALERT_EMAIL_FROM=alerts@facilityh2o.com
```

Without these, the app runs fully — email alerts are silently skipped.

## Deployment (Render)

See `render.yaml` for deployment configuration.
Deploy to Render by connecting the GitHub repo and setting env vars.
