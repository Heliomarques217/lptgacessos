# LPTG Access — Supabase Schema Reference

Project: **LPTG Access** (Production)

Reference for the four existing tables. Confirm column names in Supabase Table Editor if anything differs.

RLS and Auth users are configured in the **Supabase dashboard**, not from this repository.

## App name → table name

| App (old code) | Supabase table |
|----------------|----------------|
| pessoas | `pessoas` |
| jornadas | `jornadas` |
| registos | `entradas` |
| admins | `administradores` |

## pessoas

People with QR access cards.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| nome | text | Full name |
| funcao | text | Role / category |
| numero | text | Reference number |
| codigo | text | Unique QR value, format `LPTG-2026-…` |
| ativo | boolean | Active card |
| foto_cartao | text | Optional photo URL or base64 |
| created_at | timestamptz | Optional |

## jornadas

Race calendar.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| jornada | text | e.g. "Jornada 1" |
| data | date | ISO date |
| data_pt | text | Display date e.g. "08-03-2026" |
| hipodromo | text | Venue |
| ordem | int | Optional sort order |

## entradas

Gate check-in log (app screen: Registos).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| evento | text | Jornada label e.g. `Jornada 1 \| 08-03-2026 \| Hipódromo de …` |
| codigo | text | QR code scanned |
| nome | text | Person name at check-in |
| funcao | text | Role at check-in |
| operador | text | Staff who validated |
| datahora | timestamptz | Check-in time |

Recommended in Supabase: unique constraint on `(evento, codigo)`.

## administradores

Staff who operate the app.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| nome | text | Display name |
| email | text | Same email as Supabase Auth user |
| tipo | text | Administrador / Operador |
| ativo | boolean | Access enabled |

## Auth flow (app code)

1. User signs in with Supabase Auth (`signInWithPassword`).
2. App loads `administradores` where `email` matches and `ativo = true`.
3. If no active row, app signs out and shows an error.
4. All data requests use the Auth JWT (required once RLS is enabled).

## RLS (configure in Supabase dashboard)

When you enable RLS, typical approach:

- Role: `authenticated`
- Allow staff whose email exists in `administradores` with `ativo = true`
- Deny anonymous access to all four tables

Write policies in Supabase Table Editor or SQL Editor — not from this git repo.
