
-- =========================================================
-- MILESTONE 5: Multi-Tenant SaaS Foundation
-- =========================================================

-- ---------- 1. Core tenancy tables ----------

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  timezone text NOT NULL DEFAULT 'UTC',
  logo_url text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  address text,
  phone text,
  email text,
  brand jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinics TO authenticated;
GRANT ALL ON public.clinics TO service_role;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.clinic_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_members TO authenticated;
GRANT ALL ON public.clinic_members TO service_role;
ALTER TABLE public.clinic_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  price_cents integer NOT NULL DEFAULT 0,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.org_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_subscriptions TO authenticated;
GRANT ALL ON public.org_subscriptions TO service_role;
ALTER TABLE public.org_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.feature_flags (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text,
  default_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.org_feature_flags (
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  flag_code text NOT NULL REFERENCES public.feature_flags(code) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (org_id, flag_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_feature_flags TO authenticated;
GRANT ALL ON public.org_feature_flags TO service_role;
ALTER TABLE public.org_feature_flags ENABLE ROW LEVEL SECURITY;

-- updated_at triggers
CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_clinics_updated BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_departments_updated BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_prefs_updated BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_org_sub_updated BEFORE UPDATE ON public.org_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- 2. Security helpers ----------

CREATE OR REPLACE FUNCTION public.current_clinic_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT clinic_id FROM public.clinic_members
  WHERE user_id = auth.uid() AND is_active
$$;

CREATE OR REPLACE FUNCTION public.is_clinic_member(_clinic_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clinic_members
    WHERE user_id = auth.uid() AND clinic_id = _clinic_id AND is_active
  )
$$;

CREATE OR REPLACE FUNCTION public.current_active_clinic()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT active_clinic_id FROM public.user_preferences WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.org_has_feature(_org_id uuid, _flag text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT enabled FROM public.org_feature_flags WHERE org_id = _org_id AND flag_code = _flag),
    (SELECT default_enabled FROM public.feature_flags WHERE code = _flag),
    false
  )
$$;

-- ---------- 3. Policies on new tables ----------

CREATE POLICY "members read org" ON public.organizations FOR SELECT TO authenticated
  USING (id IN (SELECT org_id FROM public.clinics WHERE id IN (SELECT public.current_clinic_ids())));
CREATE POLICY "admin write org" ON public.organizations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "members read clinics" ON public.clinics FOR SELECT TO authenticated
  USING (id IN (SELECT public.current_clinic_ids()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin write clinics" ON public.clinics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "members read departments" ON public.departments FOR SELECT TO authenticated
  USING (clinic_id IN (SELECT public.current_clinic_ids()));
CREATE POLICY "staff manage departments" ON public.departments FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()) AND clinic_id IN (SELECT public.current_clinic_ids()))
  WITH CHECK (public.is_staff(auth.uid()) AND clinic_id IN (SELECT public.current_clinic_ids()));

CREATE POLICY "self read memberships" ON public.clinic_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage memberships" ON public.clinic_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "self manage prefs" ON public.user_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "read plans" ON public.subscription_plans FOR SELECT TO authenticated USING (true);

CREATE POLICY "read own subscription" ON public.org_subscriptions FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM public.clinics WHERE id IN (SELECT public.current_clinic_ids())));
CREATE POLICY "admin manage subscription" ON public.org_subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "read flags" ON public.feature_flags FOR SELECT TO authenticated USING (true);

CREATE POLICY "read own org flags" ON public.org_feature_flags FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM public.clinics WHERE id IN (SELECT public.current_clinic_ids())));
CREATE POLICY "admin manage org flags" ON public.org_feature_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- 4. Seed default org, clinic, plans, flags ----------

INSERT INTO public.subscription_plans (code, name, price_cents, limits) VALUES
  ('free',       'Free',       0,     '{"clinics":1,"users":5,"patients":100}'::jsonb),
  ('pro',        'Pro',        9900,  '{"clinics":3,"users":25,"patients":5000}'::jsonb),
  ('enterprise', 'Enterprise', 49900, '{"clinics":-1,"users":-1,"patients":-1}'::jsonb);

INSERT INTO public.feature_flags (code, name, description, default_enabled) VALUES
  ('telemedicine',        'Telemedicine',        'Video visits and telehealth workflows', true),
  ('ai_copilot',          'AI Clinical Copilot', 'AI-assisted charting and insights',      true),
  ('multi_location',      'Multi-Location',      'Manage multiple clinic locations',       true),
  ('api_access',          'API & MCP Access',    'External API and MCP tool access',       true),
  ('advanced_analytics',  'Advanced Analytics',  'Executive dashboards and cohort reports',true);

WITH new_org AS (
  INSERT INTO public.organizations (name, slug, timezone)
  VALUES ('Default Organization', 'default', 'UTC')
  RETURNING id
), new_clinic AS (
  INSERT INTO public.clinics (org_id, name, slug, timezone)
  SELECT id, 'Main Clinic', 'main', 'UTC' FROM new_org
  RETURNING id, org_id
), new_dept AS (
  INSERT INTO public.departments (clinic_id, name, code)
  SELECT id, 'General', 'GEN' FROM new_clinic
  RETURNING id
), sub AS (
  INSERT INTO public.org_subscriptions (org_id, plan_id, status)
  SELECT nc.org_id, p.id, 'active'
  FROM new_clinic nc, public.subscription_plans p WHERE p.code = 'enterprise'
  RETURNING 1
)
INSERT INTO public.org_feature_flags (org_id, flag_code, enabled)
SELECT nc.org_id, f.code, true FROM new_clinic nc, public.feature_flags f;

-- ---------- 5. Add clinic_id to existing tables + backfill + NOT NULL + restrictive RLS ----------

DO $mig$
DECLARE
  default_clinic uuid;
  tbl text;
  tables text[] := ARRAY[
    'patients','providers','appointments','encounters','encounter_templates','encounter_diagnoses',
    'prescriptions','lab_orders','lab_order_tests','lab_results','claims','invoices',
    'invoice_line_items','payments','credit_notes','soap_notes','vitals','allergies','documents',
    'problems','medical_history','surgical_history','family_history','social_history','immunizations',
    'imaging_studies','care_plans','follow_up_tasks','waitlist','rooms','provider_schedules',
    'conversations','messages'
  ];
BEGIN
  SELECT id INTO default_clinic FROM public.clinics WHERE slug='main' LIMIT 1;

  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinics(id)', tbl);
    EXECUTE format('UPDATE public.%I SET clinic_id = %L WHERE clinic_id IS NULL', tbl, default_clinic);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN clinic_id SET NOT NULL', tbl);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(clinic_id)', tbl || '_clinic_id_idx', tbl);
    -- RESTRICTIVE policy: ANDs with existing policies. Any read/write must be in caller's clinics.
    EXECUTE format($p$CREATE POLICY "tenant isolation" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (clinic_id IN (SELECT public.current_clinic_ids())) WITH CHECK (clinic_id IN (SELECT public.current_clinic_ids()))$p$, tbl);
  END LOOP;

  -- audit_logs: nullable clinic_id, no restrictive policy (system-wide events allowed)
  ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinics(id);
  UPDATE public.audit_logs SET clinic_id = default_clinic WHERE clinic_id IS NULL;

  -- Add department_id (optional) to a few clinical tables
  ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);
  ALTER TABLE public.encounters ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);
  ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);
END
$mig$;

-- ---------- 6. Backfill memberships for existing users ----------

DO $mem$
DECLARE
  default_clinic uuid;
BEGIN
  SELECT id INTO default_clinic FROM public.clinics WHERE slug='main' LIMIT 1;

  -- All staff (from user_roles)
  INSERT INTO public.clinic_members (clinic_id, user_id, role, is_active)
  SELECT default_clinic, ur.user_id, ur.role::text, true
  FROM public.user_roles ur
  ON CONFLICT (clinic_id, user_id) DO NOTHING;

  -- All patient portal users
  INSERT INTO public.clinic_members (clinic_id, user_id, role, is_active)
  SELECT default_clinic, pu.user_id, 'patient', true
  FROM public.patient_users pu
  ON CONFLICT (clinic_id, user_id) DO NOTHING;

  -- Prefs: default active clinic for everyone with a membership
  INSERT INTO public.user_preferences (user_id, active_clinic_id)
  SELECT DISTINCT user_id, default_clinic FROM public.clinic_members
  ON CONFLICT (user_id) DO UPDATE SET active_clinic_id = EXCLUDED.active_clinic_id
    WHERE public.user_preferences.active_clinic_id IS NULL;
END
$mem$;

-- ---------- 7. Extend new-user trigger to auto-join default clinic ----------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE default_clinic uuid;
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'doctor')
    ON CONFLICT DO NOTHING;
  INSERT INTO public.providers (user_id, name, specialty, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'specialty', 'General Medicine'),
      NEW.email
    );
  SELECT id INTO default_clinic FROM public.clinics WHERE slug='main' LIMIT 1;
  IF default_clinic IS NOT NULL THEN
    INSERT INTO public.clinic_members (clinic_id, user_id, role, is_active)
      VALUES (default_clinic, NEW.id, 'doctor', true)
      ON CONFLICT DO NOTHING;
    INSERT INTO public.user_preferences (user_id, active_clinic_id)
      VALUES (NEW.id, default_clinic)
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
