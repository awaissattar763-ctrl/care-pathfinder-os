# Milestone 5 — Multi-Tenant SaaS

Turn HealthOS into a multi-tenant platform. All existing rows land in one "Default Organization → Default Clinic" so nothing breaks.

## 1. New database tables

- `organizations` — name, slug, timezone, logo_url, plan_id, settings jsonb
- `clinics` — org_id, name, slug, timezone, address, phone, brand jsonb (colors/logo), is_active
- `departments` — clinic_id, name, code
- `clinic_members` — user_id, clinic_id, role, is_active *(per-clinic RBAC, extends existing user_roles)*
- `user_preferences` — user_id, active_clinic_id *(drives the switcher)*
- `subscription_plans` — code (free/pro/enterprise), name, price_cents, limits jsonb
- `org_subscriptions` — org_id, plan_id, status, current_period_end
- `feature_flags` — code, name, default_enabled
- `org_feature_flags` — org_id, flag_code, enabled *(overrides)*

Grants + RLS on every one. Standard `updated_at` triggers.

## 2. Tenancy columns on existing tables

Add nullable `clinic_id uuid references clinics(id)` (and `department_id` where relevant) to:
`patients, providers, appointments, encounters, encounter_templates, prescriptions, lab_orders, lab_results, claims, invoices, invoice_line_items, payments, credit_notes, soap_notes, vitals, allergies, documents, problems, medical_history, surgical_history, family_history, social_history, immunizations, imaging_studies, care_plans, follow_up_tasks, waitlist, rooms, provider_schedules, conversations, messages, audit_logs`.

## 3. Backfill

1. Insert `organizations` "Default Organization" and `clinics` "Main Clinic".
2. `UPDATE ... SET clinic_id = <default>` on every table above.
3. Insert `clinic_members` for every existing staff user (from `user_roles`) and every existing patient user.
4. Insert `user_preferences.active_clinic_id = default_clinic` for every existing user.
5. `ALTER COLUMN clinic_id SET NOT NULL` on all tables.
6. Seed `subscription_plans` (Free/Pro/Enterprise) and 5 feature flags (telemedicine, ai_copilot, multi_location, api_access, advanced_analytics). Assign default org to Enterprise so nothing gets gated.

## 4. Security helpers

```sql
current_clinic_ids()      -- clinics the auth.uid() belongs to
current_active_clinic()   -- from user_preferences
is_clinic_member(uuid)    -- staff or patient membership check
org_has_feature(uuid,text)
```

All `SECURITY DEFINER` with locked search_path.

## 5. RLS rewrite (isolation)

For every tenant table, replace/augment policies:

- **Staff read/write**: `is_staff(auth.uid()) AND clinic_id IN (SELECT current_clinic_ids())`
- **Patient portal read**: existing `current_patient_id()` checks kept, PLUS `clinic_id` must match the patient's clinic.
- **Cross-clinic leaks blocked**: no policy uses `TRUE` or ignores clinic_id.

`audit_logs` scoped by clinic. `organizations`/`clinics`/`departments` readable by their members; org admins can update.

## 6. Server-side scoping

- New `requireClinicContext` server-fn middleware wraps `requireSupabaseAuth`, resolves active clinic from `user_preferences`, validates membership, exposes `context.clinicId` + `context.orgId`.
- Every existing `createServerFn` that writes gets `clinic_id: context.clinicId` injected on inserts (encounters, invoices, etc.).

## 7. Frontend

- **`ClinicContext` provider** in `AppShell`: fetches user's clinics + active clinic, exposes `useActiveClinic()`.
- **Clinic switcher** dropdown in `AppShell` header (reuses existing `Select`). Persists to `user_preferences`, invalidates all queries.
- **Feature-flag hook** `useFeature(code)` — gates Telemedicine/Copilot nav items.
- **New route `/settings/organization`** (admin only): org info, clinics list, add clinic, departments, branding, timezone, feature toggles, current plan.
- **All existing `useCreate*` hooks** get `clinic_id` from context on insert. Reads rely on RLS — no query rewrites needed.
- **Patient/staff onboarding**: new user auto-added to default clinic via existing `handle_new_user` trigger extension.

## 8. Storage isolation

Bucket path convention: `clinic/<clinic_id>/<entity>/<file>`. Storage RLS policy: user must be member of the clinic in the path. (No buckets exist yet — added when documents/attachments start using storage.)

## 9. Preservation guarantees

- Every existing route, component, hook, and API contract keeps working.
- MCP tools (`list_patients`, `get_patient`, `list_appointments`) auto-scope via RLS — no code changes.
- Billing, Encounters, EMR, Portal continue to function against default clinic transparently.
- Existing `user_roles` (`admin`/`doctor`/`nurse`/etc.) stays authoritative for permission checks; `clinic_members.role` refines it per clinic.

## Technical details

- Single migration file, transactional. Order: create → grant → RLS → policies → backfill → NOT NULL → seed plans/flags.
- Helper `current_clinic_ids()` returns `SETOF uuid` from `clinic_members WHERE user_id = auth.uid() AND is_active`.
- `user_preferences` initialized lazily on first `/api/preferences` fetch if missing.
- Types regenerated post-migration; then `src/hooks/queries/*` gets minimal edits to inject `clinic_id` in inserts (single helper `withClinic(payload)` from `ClinicContext`).
- New files: `src/hooks/queries/tenant.ts`, `src/contexts/ClinicContext.tsx`, `src/components/ClinicSwitcher.tsx`, `src/routes/settings.organization.tsx`, `src/lib/features.ts`, `src/integrations/supabase/clinic-middleware.ts`.

## What ships in order

1. Migration (schema + backfill + RLS) — approve first.
2. `ClinicContext` + switcher + `useFeature`.
3. Insert-side `clinic_id` injection across existing hooks.
4. `/settings/organization` admin surface.
5. Verify: RLS test queries, typecheck, smoke the preview.
