
-- EMR expansion tables

CREATE TABLE public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icd10 TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  onset_date DATE,
  resolved_date DATE,
  note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.problems TO authenticated;
GRANT ALL ON public.problems TO service_role;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage problems" ON public.problems FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "patient reads own problems" ON public.problems FOR SELECT TO authenticated USING (patient_id = public.current_patient_id());
CREATE TRIGGER problems_updated_at BEFORE UPDATE ON public.problems FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  condition TEXT NOT NULL,
  year_diagnosed INT,
  status TEXT DEFAULT 'past',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_history TO authenticated;
GRANT ALL ON public.medical_history TO service_role;
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage medical_history" ON public.medical_history FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "patient reads own medical_history" ON public.medical_history FOR SELECT TO authenticated USING (patient_id = public.current_patient_id());
CREATE TRIGGER medical_history_updated_at BEFORE UPDATE ON public.medical_history FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.surgical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  procedure TEXT NOT NULL,
  procedure_date DATE,
  surgeon TEXT,
  facility TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surgical_history TO authenticated;
GRANT ALL ON public.surgical_history TO service_role;
ALTER TABLE public.surgical_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage surgical_history" ON public.surgical_history FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "patient reads own surgical_history" ON public.surgical_history FOR SELECT TO authenticated USING (patient_id = public.current_patient_id());
CREATE TRIGGER surgical_history_updated_at BEFORE UPDATE ON public.surgical_history FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.family_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  relation TEXT NOT NULL,
  condition TEXT NOT NULL,
  age_of_onset INT,
  deceased BOOLEAN DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_history TO authenticated;
GRANT ALL ON public.family_history TO service_role;
ALTER TABLE public.family_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage family_history" ON public.family_history FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "patient reads own family_history" ON public.family_history FOR SELECT TO authenticated USING (patient_id = public.current_patient_id());
CREATE TRIGGER family_history_updated_at BEFORE UPDATE ON public.family_history FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.social_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL UNIQUE REFERENCES public.patients(id) ON DELETE CASCADE,
  smoking_status TEXT,
  alcohol_use TEXT,
  substance_use TEXT,
  occupation TEXT,
  marital_status TEXT,
  living_situation TEXT,
  exercise TEXT,
  diet TEXT,
  note TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_history TO authenticated;
GRANT ALL ON public.social_history TO service_role;
ALTER TABLE public.social_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage social_history" ON public.social_history FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "patient reads own social_history" ON public.social_history FOR SELECT TO authenticated USING (patient_id = public.current_patient_id());
CREATE TRIGGER social_history_updated_at BEFORE UPDATE ON public.social_history FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.immunizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  vaccine TEXT NOT NULL,
  administered_date DATE,
  dose_number INT,
  lot_number TEXT,
  administered_by TEXT,
  site TEXT,
  next_due_date DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.immunizations TO authenticated;
GRANT ALL ON public.immunizations TO service_role;
ALTER TABLE public.immunizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage immunizations" ON public.immunizations FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "patient reads own immunizations" ON public.immunizations FOR SELECT TO authenticated USING (patient_id = public.current_patient_id());
CREATE TRIGGER immunizations_updated_at BEFORE UPDATE ON public.immunizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.imaging_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  modality TEXT NOT NULL,
  body_part TEXT,
  study_name TEXT NOT NULL,
  study_date DATE,
  ordered_by TEXT,
  facility TEXT,
  status TEXT DEFAULT 'completed',
  impression TEXT,
  report_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imaging_studies TO authenticated;
GRANT ALL ON public.imaging_studies TO service_role;
ALTER TABLE public.imaging_studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage imaging_studies" ON public.imaging_studies FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "patient reads own imaging_studies" ON public.imaging_studies FOR SELECT TO authenticated USING (patient_id = public.current_patient_id());
CREATE TRIGGER imaging_studies_updated_at BEFORE UPDATE ON public.imaging_studies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  goal TEXT,
  status TEXT DEFAULT 'active',
  start_date DATE,
  target_date DATE,
  interventions TEXT,
  owner_provider_id UUID REFERENCES public.providers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_plans TO authenticated;
GRANT ALL ON public.care_plans TO service_role;
ALTER TABLE public.care_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage care_plans" ON public.care_plans FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "patient reads own care_plans" ON public.care_plans FOR SELECT TO authenticated USING (patient_id = public.current_patient_id());
CREATE TRIGGER care_plans_updated_at BEFORE UPDATE ON public.care_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.follow_up_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'open',
  assigned_provider_id UUID REFERENCES public.providers(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_up_tasks TO authenticated;
GRANT ALL ON public.follow_up_tasks TO service_role;
ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage follow_up_tasks" ON public.follow_up_tasks FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "patient reads own follow_up_tasks" ON public.follow_up_tasks FOR SELECT TO authenticated USING (patient_id = public.current_patient_id());
CREATE TRIGGER follow_up_tasks_updated_at BEFORE UPDATE ON public.follow_up_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_problems_patient ON public.problems(patient_id);
CREATE INDEX idx_medhist_patient ON public.medical_history(patient_id);
CREATE INDEX idx_surghist_patient ON public.surgical_history(patient_id);
CREATE INDEX idx_famhist_patient ON public.family_history(patient_id);
CREATE INDEX idx_imm_patient ON public.immunizations(patient_id);
CREATE INDEX idx_imaging_patient ON public.imaging_studies(patient_id);
CREATE INDEX idx_careplans_patient ON public.care_plans(patient_id);
CREATE INDEX idx_followup_patient_status ON public.follow_up_tasks(patient_id, status);
