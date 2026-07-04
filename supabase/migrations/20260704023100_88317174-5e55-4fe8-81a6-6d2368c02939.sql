
-- Encounters
CREATE TABLE public.encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  visit_type text NOT NULL DEFAULT 'follow-up',
  status text NOT NULL DEFAULT 'scheduled',
  chief_complaint text,
  hpi text,
  ros jsonb NOT NULL DEFAULT '{}'::jsonb,
  exam jsonb NOT NULL DEFAULT '{}'::jsonb,
  assessment text,
  plan text,
  follow_up_instructions text,
  encounter_date timestamptz NOT NULL DEFAULT now(),
  signed_at timestamptz,
  signed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  locked boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX encounters_patient_idx ON public.encounters(patient_id, encounter_date DESC);
CREATE INDEX encounters_status_idx ON public.encounters(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.encounters TO authenticated;
GRANT ALL ON public.encounters TO service_role;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage encounters" ON public.encounters
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Patients read own encounters" ON public.encounters
  FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id() AND signed_at IS NOT NULL);

CREATE TRIGGER trg_encounters_updated_at
  BEFORE UPDATE ON public.encounters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Diagnoses
CREATE TABLE public.encounter_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  code text,
  description text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX encounter_diagnoses_encounter_idx ON public.encounter_diagnoses(encounter_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.encounter_diagnoses TO authenticated;
GRANT ALL ON public.encounter_diagnoses TO service_role;
ALTER TABLE public.encounter_diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage encounter diagnoses" ON public.encounter_diagnoses
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Patients read own encounter diagnoses" ON public.encounter_diagnoses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.encounters e
    WHERE e.id = encounter_diagnoses.encounter_id
      AND e.patient_id = public.current_patient_id()
      AND e.signed_at IS NOT NULL
  ));

-- Templates
CREATE TABLE public.encounter_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  visit_type text NOT NULL DEFAULT 'follow-up',
  chief_complaint text,
  hpi_template text,
  ros jsonb NOT NULL DEFAULT '{}'::jsonb,
  exam jsonb NOT NULL DEFAULT '{}'::jsonb,
  assessment_template text,
  plan_template text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.encounter_templates TO authenticated;
GRANT ALL ON public.encounter_templates TO service_role;
ALTER TABLE public.encounter_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read templates" ON public.encounter_templates
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Doctors and admins manage templates" ON public.encounter_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'doctor'));

CREATE TRIGGER trg_encounter_templates_updated_at
  BEFORE UPDATE ON public.encounter_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default templates
INSERT INTO public.encounter_templates (name, visit_type, chief_complaint, hpi_template, ros, exam, plan_template) VALUES
('Diabetes Follow-up','follow-up','Diabetes management follow-up',
 'Patient with T2DM here for routine follow-up. Reviewing glycemic control, medications, adherence, hypoglycemia, and complications screening.',
 '{"Constitutional":"Denies fever/weight change","Cardiovascular":"Denies chest pain","Endocrine":"Reports polyuria/polydipsia as noted"}'::jsonb,
 '{"General":"Well appearing","Feet":"No ulcers, monofilament intact","Cardiovascular":"RRR, no murmurs"}'::jsonb,
 'Continue current regimen. Recheck HbA1c in 3 months. Annual eye and foot exam. Reinforce diet and exercise.'),
('Hypertension Follow-up','follow-up','Hypertension follow-up',
 'Patient with essential HTN, reviewing BP log, medication adherence, side effects, and lifestyle.',
 '{"Constitutional":"Denies headaches","Cardiovascular":"Denies chest pain, palpitations"}'::jsonb,
 '{"Vital signs":"BP measured in both arms","Cardiovascular":"Normal S1/S2"}'::jsonb,
 'Continue antihypertensives. Home BP log. Low-sodium diet. Recheck in 3 months.'),
('Annual Wellness','annual-physical','Annual wellness visit',
 'Patient here for annual wellness exam. No acute complaints.',
 '{"Constitutional":"Denies fatigue, fever, weight change","Cardiovascular":"Denies chest pain","Respiratory":"Denies dyspnea","Gastrointestinal":"Normal","Neurological":"Denies HA/dizziness"}'::jsonb,
 '{"General":"Well appearing, NAD","HEENT":"Normocephalic","Cardiovascular":"RRR","Respiratory":"CTAB","Abdomen":"Soft, NT, ND"}'::jsonb,
 'Age-appropriate screenings ordered. Immunizations updated. Return in 1 year.'),
('Pediatric Visit','follow-up','Pediatric well-child',
 'Well-child visit. Growth and development on track. Immunizations reviewed.',
 '{"Constitutional":"Active, feeding well","Respiratory":"No cough","Gastrointestinal":"Normal stool pattern"}'::jsonb,
 '{"Growth":"Height/weight plotted","General":"Alert, playful","HEENT":"TMs clear"}'::jsonb,
 'Anticipatory guidance. Immunizations per schedule. Next well-child visit at recommended interval.'),
('General Consultation','consultation','Consultation',
 'Patient referred for specialist consultation. History reviewed.',
 '{"Constitutional":"See HPI"}'::jsonb,
 '{"General":"See findings"}'::jsonb,
 'Recommendations sent to referring provider. Follow-up as clinically indicated.');
