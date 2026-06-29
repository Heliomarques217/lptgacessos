# LPTG Access

Private credential and gate check-in system for LPTG race days.

## What lives where

| Folder / file | Purpose |
|---------------|---------|
| `public/index.html` | Page layout (screens) |
| `public/css/app.css` | Styles |
| `public/js/app.js` | App startup and actions |
| `public/js/config.js` | Supabase URL and anon key |
| `public/js/data/` | Database reads/writes |
| `public/js/features/auth.js` | Supabase Auth login / logout |
| `public/js/ui/render.js` | Tables and stats |
| `supabase/SCHEMA.md` | Database table reference |
| `wrangler.jsonc` | Cloudflare Pages config |

## Supabase tables (already exist)

- `pessoas` — people with QR codes
- `jornadas` — race calendar
- `entradas` — check-in log (app screen: Registos)
- `administradores` — staff access

---

## Part A — This repo (Cloudflare app)

### 1. Supabase credentials

Edit `public/js/config.js`:

```javascript
export const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "your_anon_key";
```

Get values from Supabase → Settings → API.

### 2. Deploy on Cloudflare

```bash
npx wrangler pages deploy public
```

Or connect this repo to Cloudflare Pages with output directory `public`.

Site must be served over **HTTPS** for QR camera scanning.

### 3. Local preview

```bash
npx wrangler pages dev public
```

---

## Part B — Supabase dashboard (you configure there)

Nothing in this repo runs SQL or changes Supabase. Do the following in your Supabase project.

### 1. Authentication → Users

Create one user per staff member (email + password).

### 2. Table `administradores`

For each Auth user, add a row with the **same email**, plus `nome`, `tipo`, and `ativo = true`.

The app signs in with Supabase Auth, then checks this table. If there is no active row, login is rejected.

### 3. Enable RLS (when ready)

In Supabase (Table Editor or SQL Editor — your choice):

1. Enable RLS on `pessoas`, `jornadas`, `entradas`, `administradores`.
2. Add policies for role **`authenticated`** so logged-in staff can read/write what they need.
3. Ensure anonymous (not logged in) requests are blocked.

The app already sends the Auth JWT on every API call after login, so RLS policies apply automatically.

Suggested order:

1. Deploy app + create Auth users + `administradores` rows  
2. Test with RLS still off (optional)  
3. Enable RLS and add policies  
4. Test again — logged out blocked, logged in works  

### 4. Optional hardening

- Unique index on `entradas (evento, codigo)` to prevent double check-in at the database level  
- Storage bucket for card photos if you move off `foto_cartao` base64  

---

## Day-to-day operations

| Task | Where |
|------|-------|
| Add race day | Supabase → `jornadas` |
| Add person + QR | App → Adicionar pessoa |
| Validate entry | App → Validar entrada |
| View check-ins | App → Registos |
| Add staff | Supabase Auth + `administradores` table |
| Export Excel | App → Export buttons |

## Troubleshooting

- **"Configura config.js"** — fill in Supabase URL and anon key.
- **Login fails** — user must exist in Auth AND `administradores` with `ativo = true`.
- **RLS errors / empty data** — log in first; policies must allow `authenticated` staff.
- **Duplicate entry** — same QR already checked in for that jornada (expected).
