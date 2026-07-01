
-- ============ 1. Fix set_updated_at search_path ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============ 2. Revoke EXECUTE from trigger-only SECURITY DEFINER fns ============
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_conversation_last_message() FROM PUBLIC, anon, authenticated;
-- Revoke from anon on the RLS helpers (still callable by authenticated for RLS eval)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_patient_id() FROM PUBLIC, anon;

-- ============ 3. Remove medical tables from realtime publication ============
ALTER PUBLICATION supabase_realtime DROP TABLE public.appointments;
ALTER PUBLICATION supabase_realtime DROP TABLE public.waitlist;

-- ============ 4. Tighten audit_logs read policy ============
DROP POLICY IF EXISTS "staff read audit" ON public.audit_logs;
CREATE POLICY "staff read audit" ON public.audit_logs
FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff insert audit" ON public.audit_logs;
CREATE POLICY "staff insert audit" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()) AND user_id = auth.uid());

-- ============ 5. Tighten staff write/read policies on medical tables ============
DO $$
DECLARE
  t text;
  medical_tables text[] := ARRAY[
    'allergies','vitals','prescriptions','soap_notes','documents',
    'lab_orders','lab_results','lab_order_tests','claims'
  ];
BEGIN
  FOREACH t IN ARRAY medical_tables LOOP
    -- staff read (keep restricted to staff; patients have their own SELECT policy)
    EXECUTE format('DROP POLICY IF EXISTS "staff read %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "staff insert %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "staff update %s" ON public.%I', t, t);
  END LOOP;
END $$;

-- Explicit policy recreations (per-table because the DROP names above use short suffixes)
-- allergies
DROP POLICY IF EXISTS "staff read allergies" ON public.allergies;
DROP POLICY IF EXISTS "staff insert allergies" ON public.allergies;
DROP POLICY IF EXISTS "staff update allergies" ON public.allergies;
CREATE POLICY "staff read allergies" ON public.allergies FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert allergies" ON public.allergies FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update allergies" ON public.allergies FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- vitals
DROP POLICY IF EXISTS "staff read vitals" ON public.vitals;
DROP POLICY IF EXISTS "staff insert vitals" ON public.vitals;
DROP POLICY IF EXISTS "staff update vitals" ON public.vitals;
CREATE POLICY "staff read vitals" ON public.vitals FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert vitals" ON public.vitals FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update vitals" ON public.vitals FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- prescriptions
DROP POLICY IF EXISTS "staff read rx" ON public.prescriptions;
DROP POLICY IF EXISTS "staff insert rx" ON public.prescriptions;
DROP POLICY IF EXISTS "staff update rx" ON public.prescriptions;
CREATE POLICY "staff read rx" ON public.prescriptions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert rx" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update rx" ON public.prescriptions FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- soap_notes
DROP POLICY IF EXISTS "staff read soap" ON public.soap_notes;
DROP POLICY IF EXISTS "staff insert soap" ON public.soap_notes;
DROP POLICY IF EXISTS "staff update soap" ON public.soap_notes;
CREATE POLICY "staff read soap" ON public.soap_notes FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert soap" ON public.soap_notes FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update soap" ON public.soap_notes FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- documents
DROP POLICY IF EXISTS "staff read documents" ON public.documents;
DROP POLICY IF EXISTS "staff insert documents" ON public.documents;
DROP POLICY IF EXISTS "staff update documents" ON public.documents;
CREATE POLICY "staff read documents" ON public.documents FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update documents" ON public.documents FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- lab_orders
DROP POLICY IF EXISTS "staff read lab_orders" ON public.lab_orders;
DROP POLICY IF EXISTS "staff insert lab_orders" ON public.lab_orders;
DROP POLICY IF EXISTS "staff update lab_orders" ON public.lab_orders;
CREATE POLICY "staff read lab_orders" ON public.lab_orders FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert lab_orders" ON public.lab_orders FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update lab_orders" ON public.lab_orders FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- lab_results
DROP POLICY IF EXISTS "staff read lab_results" ON public.lab_results;
DROP POLICY IF EXISTS "staff insert lab_results" ON public.lab_results;
DROP POLICY IF EXISTS "staff update lab_results" ON public.lab_results;
CREATE POLICY "staff read lab_results" ON public.lab_results FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert lab_results" ON public.lab_results FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update lab_results" ON public.lab_results FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- lab_order_tests
DROP POLICY IF EXISTS "staff read lab_order_tests" ON public.lab_order_tests;
DROP POLICY IF EXISTS "staff insert lab_order_tests" ON public.lab_order_tests;
DROP POLICY IF EXISTS "staff update lab_order_tests" ON public.lab_order_tests;
CREATE POLICY "staff read lab_order_tests" ON public.lab_order_tests FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert lab_order_tests" ON public.lab_order_tests FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update lab_order_tests" ON public.lab_order_tests FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- claims
DROP POLICY IF EXISTS "staff read claims" ON public.claims;
DROP POLICY IF EXISTS "staff insert claims" ON public.claims;
DROP POLICY IF EXISTS "staff update claims" ON public.claims;
CREATE POLICY "staff read claims" ON public.claims FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert claims" ON public.claims FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update claims" ON public.claims FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- patients (staff can read/write all; patients keep their own SELECT/UPDATE policies)
DROP POLICY IF EXISTS "staff read patients" ON public.patients;
DROP POLICY IF EXISTS "staff insert patients" ON public.patients;
DROP POLICY IF EXISTS "staff update patients" ON public.patients;
CREATE POLICY "staff read patients" ON public.patients FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update patients" ON public.patients FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- appointments (staff only for write; patients keep SELECT)
DROP POLICY IF EXISTS "staff read appts" ON public.appointments;
DROP POLICY IF EXISTS "staff insert appts" ON public.appointments;
DROP POLICY IF EXISTS "staff update appts" ON public.appointments;
DROP POLICY IF EXISTS "staff delete appts" ON public.appointments;
CREATE POLICY "staff read appts" ON public.appointments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert appts" ON public.appointments FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update appts" ON public.appointments FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff delete appts" ON public.appointments FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- providers
DROP POLICY IF EXISTS "staff read providers" ON public.providers;
DROP POLICY IF EXISTS "staff insert providers" ON public.providers;
DROP POLICY IF EXISTS "staff update providers" ON public.providers;
CREATE POLICY "staff read providers" ON public.providers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert providers" ON public.providers FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update providers" ON public.providers FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- rooms
DROP POLICY IF EXISTS "staff read rooms" ON public.rooms;
DROP POLICY IF EXISTS "staff insert rooms" ON public.rooms;
DROP POLICY IF EXISTS "staff update rooms" ON public.rooms;
CREATE POLICY "staff read rooms" ON public.rooms FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert rooms" ON public.rooms FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update rooms" ON public.rooms FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- provider_schedules
DROP POLICY IF EXISTS "staff read schedules" ON public.provider_schedules;
DROP POLICY IF EXISTS "staff insert schedules" ON public.provider_schedules;
DROP POLICY IF EXISTS "staff update schedules" ON public.provider_schedules;
CREATE POLICY "staff read schedules" ON public.provider_schedules FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert schedules" ON public.provider_schedules FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update schedules" ON public.provider_schedules FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- waitlist
DROP POLICY IF EXISTS "staff read waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "staff insert waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "staff update waitlist" ON public.waitlist;
CREATE POLICY "staff read waitlist" ON public.waitlist FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert waitlist" ON public.waitlist FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update waitlist" ON public.waitlist FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
