# CLAUDE.md — Atomic CRM + Resend Drip Campaign
# Side project: epiSolve personal CRM lab
# DO NOT mix with MTM platform work

## Project identity
- **Scope:** Personal side project — epiSolve Atomic CRM instance + Resend
- **Goal:** Import contacts → 3-step drip campaign → delivery feedback loop
- **Stack:** Atomic CRM (self-hosted) · Supabase (Atomic's DB) · n8n (self-hosted) · Resend · React Email
- **Environment:** Existing epiSolve Atomic instance — NOT a new deploy
- **MTM platform:** Completely out of scope for this project

## What you need to read first
Before writing any code or SQL, read:
1. The Atomic CRM migration files to get real table/column names
   - Look in: packages/twenty-server/src/database/typeorm/core/migrations
2. The people/workspace member schema — drip fields attach here
3. Any existing custom field patterns in the Atomic codebase

## What we are building
1. Custom drip tracking fields on the People object in Atomic CRM
   - drip_campaign (text/enum)
   - drip_step (int, default 0)
   - drip_enrolled_at (timestamptz)
   - drip_last_sent_at (timestamptz)
   - drip_suppressed (bool, default false)

2. n8n workflow — scheduled drip sender
   - Schedule trigger (daily)
   - Postgres node queries contacts by step + time elapsed
   - Resend node sends per-step email
   - Postgres node writes step advancement back to CRM

3. n8n webhook workflow — Resend delivery feedback
   - Receives: email.delivered, email.opened, email.clicked, email.bounced, email.complained
   - Bounced/complained → set drip_suppressed = true in Atomic
   - Opened/clicked → update engagement field

4. Contact import path
   - CSV → Atomic CRM native import (manual, acceptable for now)
   - Future: n8n Spreadsheet → Supabase insert workflow

## Do not touch
- Any existing Atomic CRM migration files (never modify, append only)
- Production Supabase data without a tested migration
- MTM platform Supabase project (separate instance entirely)
- .env files — ask before reading or modifying

## Drip campaign cadence (3-step)
- Step 0 → 1: Send immediately on enrollment
- Step 1 → 2: Send after 3 days
- Step 2 → 3: Send after 7 days from step 2
- Step 3: Campaign complete — no further sends

## When uncertain
Stop and ask before:
- Adding columns to Atomic's core tables (prefer custom field pattern)
- Running any UPDATE/DELETE against people records
- Touching Resend domain or API key config

## Conventions
- All SQL uses timestamptz, not timestamp
- n8n workflow names: prefix with "Drip —" (e.g. "Drip — Step Sender")
- Resend template IDs stored as env vars in n8n, not hardcoded
- React Email templates live in /emails directory
- Run /compact at natural checkpoints and update memory.md

## Current state

Phase 0 — reading Atomic schema, designing custom fields
Next: Confirm people table column names, draft migration SQL
