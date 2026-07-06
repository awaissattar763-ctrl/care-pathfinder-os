
-- 1. Default clinic_id to the caller's active clinic on every tenant table.
DO $$
DECLARE tbl text;
  tables text[] := ARRAY[
    'patients','providers','appointments','encounters','encounter_templates','encounter_diagnoses',
    'prescriptions','lab_orders','lab_order_tests','lab_results','claims','invoices',
    'invoice_line_items','payments','credit_notes','soap_notes','vitals','allergies','documents',
    'problems','medical_history','surgical_history','family_history','social_history','immunizations',
    'imaging_studies','care_plans','follow_up_tasks','waitlist','rooms','provider_schedules',
    'conversations','messages'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN clinic_id SET DEFAULT public.current_active_clinic()', tbl);
  END LOOP;
END $$;

-- 2. Lock down new SECURITY DEFINER helpers: only signed-in users, not anon.
REVOKE EXECUTE ON FUNCTION public.current_clinic_ids()      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_clinic_member(uuid)    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_active_clinic()   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.org_has_feature(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_clinic_ids()      TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_clinic_member(uuid)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_active_clinic()   TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_has_feature(uuid,text) TO authenticated;
