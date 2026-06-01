
-- Extend patients table
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS blood_group text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS insurance jsonb,
  ADD COLUMN IF NOT EXISTS emergency_contact jsonb,
  ADD COLUMN IF NOT EXISTS flags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS risk_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_summary jsonb,
  ADD COLUMN IF NOT EXISTS primary_care_id uuid REFERENCES public.providers(id) ON DELETE SET NULL;

-- Allergies
CREATE TABLE IF NOT EXISTS public.allergies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name text NOT NULL,
  reaction text,
  severity text NOT NULL DEFAULT 'mild',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.allergies TO authenticated;
GRANT ALL ON public.allergies TO service_role;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read allergies" ON public.allergies FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert allergies" ON public.allergies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update allergies" ON public.allergies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete allergies" ON public.allergies FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Vitals
CREATE TABLE IF NOT EXISTS public.vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  label text NOT NULL,
  value text NOT NULL,
  unit text,
  trend text DEFAULT 'flat',
  series jsonb,
  measured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitals TO authenticated;
GRANT ALL ON public.vitals TO service_role;
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read vitals" ON public.vitals FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert vitals" ON public.vitals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update vitals" ON public.vitals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete vitals" ON public.vitals FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name text NOT NULL,
  modality text,
  size text,
  date date,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update documents" ON public.documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete documents" ON public.documents FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- SOAP notes
CREATE TABLE IF NOT EXISTS public.soap_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  author text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  s text,
  o text,
  a text,
  p text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.soap_notes TO authenticated;
GRANT ALL ON public.soap_notes TO service_role;
ALTER TABLE public.soap_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read soap" ON public.soap_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert soap" ON public.soap_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update soap" ON public.soap_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete soap" ON public.soap_notes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
