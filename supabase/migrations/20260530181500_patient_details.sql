-- Add new columns to patients
ALTER TABLE public.patients
ADD COLUMN blood_group TEXT,
ADD COLUMN insurance JSONB,
ADD COLUMN emergency_contact JSONB,
ADD COLUMN address TEXT,
ADD COLUMN flags TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN risk_score INTEGER,
ADD COLUMN primary_care_provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
ADD COLUMN ai_summary JSONB;

-- ============ ALLERGIES ============
CREATE TABLE public.allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  reaction TEXT,
  severity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.allergies TO authenticated;
GRANT ALL ON public.allergies TO service_role;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read allergies" ON public.allergies FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert allergies" ON public.allergies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update allergies" ON public.allergies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "staff delete allergies" ON public.allergies FOR DELETE TO authenticated USING (true);

-- ============ VITALS ============
CREATE TABLE public.vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT NOT NULL,
  trend TEXT,
  series JSONB,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitals TO authenticated;
GRANT ALL ON public.vitals TO service_role;
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read vitals" ON public.vitals FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert vitals" ON public.vitals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update vitals" ON public.vitals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "staff delete vitals" ON public.vitals FOR DELETE TO authenticated USING (true);

-- ============ DOCUMENTS ============
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  modality TEXT,
  date TEXT,
  size TEXT,
  storage_path TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update documents" ON public.documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "staff delete documents" ON public.documents FOR DELETE TO authenticated USING (true);

-- ============ SOAP NOTES ============
CREATE TABLE public.soap_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  s TEXT,
  o TEXT,
  a TEXT,
  p TEXT,
  date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soap_notes TO authenticated;
GRANT ALL ON public.soap_notes TO service_role;
ALTER TABLE public.soap_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read soap_notes" ON public.soap_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert soap_notes" ON public.soap_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update soap_notes" ON public.soap_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "staff delete soap_notes" ON public.soap_notes FOR DELETE TO authenticated USING (true);
