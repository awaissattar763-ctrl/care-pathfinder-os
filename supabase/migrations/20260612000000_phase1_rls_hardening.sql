-- ============================================================
-- PHASE 1 SECURITY: RLS HARDENING
-- Replaces every permissive `TO authenticated USING (true)` staff
-- policy with role-scoped checks that mirror the app permission
-- matrix (src/lib/rbac.ts). Patient "own record" policies created
-- earlier are untouched — they were already correctly scoped via
-- public.current_patient_id().
-- ============================================================

-- ---------- HELPERS ----------
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_user_id, ARRAY['admin','doctor','nurse','receptionist','lab_tech']::public.app_role[]);
$$;

-- ============================================================
-- PATIENTS  (read: all staff · write: admin/doctor/nurse/receptionist)
-- ============================================================
DROP POLICY IF EXISTS "staff read patients" ON public.patients;
DROP POLICY IF EXISTS "staff insert patients" ON public.patients;
DROP POLICY IF EXISTS "staff update patients" ON public.patients;
CREATE POLICY "staff read patients" ON public.patients FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert patients" ON public.patients FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','receptionist']::public.app_role[]));
CREATE POLICY "staff update patients" ON public.patients FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','receptionist']::public.app_role[]));

-- ============================================================
-- APPOINTMENTS  (read/write: admin/doctor/nurse/receptionist)
-- ============================================================
DROP POLICY IF EXISTS "staff read appts" ON public.appointments;
DROP POLICY IF EXISTS "staff insert appts" ON public.appointments;
DROP POLICY IF EXISTS "staff update appts" ON public.appointments;
DROP POLICY IF EXISTS "staff delete appts" ON public.appointments;
CREATE POLICY "staff read appts" ON public.appointments FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','receptionist']::public.app_role[]));
CREATE POLICY "staff insert appts" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','receptionist']::public.app_role[]));
CREATE POLICY "staff update appts" ON public.appointments FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','receptionist']::public.app_role[]));
CREATE POLICY "staff delete appts" ON public.appointments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- PRESCRIPTIONS  (read: admin/doctor/nurse · write: admin/doctor ONLY)
-- ============================================================
DROP POLICY IF EXISTS "staff read rx" ON public.prescriptions;
DROP POLICY IF EXISTS "staff insert rx" ON public.prescriptions;
DROP POLICY IF EXISTS "staff update rx" ON public.prescriptions;
CREATE POLICY "staff read rx" ON public.prescriptions FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse']::public.app_role[]));
CREATE POLICY "doctor insert rx" ON public.prescriptions FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','doctor']::public.app_role[]));
CREATE POLICY "doctor update rx" ON public.prescriptions FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor']::public.app_role[]));

-- ============================================================
-- LAB ORDERS / TESTS  (read+write: admin/doctor/nurse/lab_tech)
-- ============================================================
DROP POLICY IF EXISTS "staff read lab_orders" ON public.lab_orders;
DROP POLICY IF EXISTS "staff insert lab_orders" ON public.lab_orders;
DROP POLICY IF EXISTS "staff update lab_orders" ON public.lab_orders;
CREATE POLICY "staff read lab_orders" ON public.lab_orders FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','lab_tech']::public.app_role[]));
CREATE POLICY "staff insert lab_orders" ON public.lab_orders FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','lab_tech']::public.app_role[]));
CREATE POLICY "staff update lab_orders" ON public.lab_orders FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','lab_tech']::public.app_role[]));

DROP POLICY IF EXISTS "staff read lab_order_tests" ON public.lab_order_tests;
DROP POLICY IF EXISTS "staff insert lab_order_tests" ON public.lab_order_tests;
DROP POLICY IF EXISTS "staff update lab_order_tests" ON public.lab_order_tests;
CREATE POLICY "staff read lab_order_tests" ON public.lab_order_tests FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','lab_tech']::public.app_role[]));
CREATE POLICY "staff insert lab_order_tests" ON public.lab_order_tests FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','lab_tech']::public.app_role[]));
CREATE POLICY "staff update lab_order_tests" ON public.lab_order_tests FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','lab_tech']::public.app_role[]));

-- ============================================================
-- LAB RESULTS  (read: admin/doctor/nurse/lab_tech · write: admin/lab_tech ONLY — mirrors labs.result)
-- ============================================================
DROP POLICY IF EXISTS "staff read lab_results" ON public.lab_results;
DROP POLICY IF EXISTS "staff insert lab_results" ON public.lab_results;
DROP POLICY IF EXISTS "staff update lab_results" ON public.lab_results;
CREATE POLICY "staff read lab_results" ON public.lab_results FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','lab_tech']::public.app_role[]));
CREATE POLICY "labtech insert lab_results" ON public.lab_results FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','lab_tech']::public.app_role[]));
CREATE POLICY "labtech update lab_results" ON public.lab_results FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','lab_tech']::public.app_role[]));

-- ============================================================
-- CLINICAL RECORD TABLES: soap_notes, vitals, allergies, documents
-- (read: all staff · write: admin/doctor/nurse)
-- ============================================================
DROP POLICY IF EXISTS "staff read soap" ON public.soap_notes;
DROP POLICY IF EXISTS "staff read soap_notes" ON public.soap_notes;
DROP POLICY IF EXISTS "staff insert soap" ON public.soap_notes;
DROP POLICY IF EXISTS "staff insert soap_notes" ON public.soap_notes;
DROP POLICY IF EXISTS "staff update soap" ON public.soap_notes;
DROP POLICY IF EXISTS "staff update soap_notes" ON public.soap_notes;
DROP POLICY IF EXISTS "staff delete soap_notes" ON public.soap_notes;
CREATE POLICY "staff read soap_notes" ON public.soap_notes FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "clinical insert soap_notes" ON public.soap_notes FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse']::public.app_role[]));
CREATE POLICY "clinical update soap_notes" ON public.soap_notes FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse']::public.app_role[]));
CREATE POLICY "clinical delete soap_notes" ON public.soap_notes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "staff read vitals" ON public.vitals;
DROP POLICY IF EXISTS "staff insert vitals" ON public.vitals;
DROP POLICY IF EXISTS "staff update vitals" ON public.vitals;
DROP POLICY IF EXISTS "staff delete vitals" ON public.vitals;
CREATE POLICY "staff read vitals" ON public.vitals FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "clinical insert vitals" ON public.vitals FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse']::public.app_role[]));
CREATE POLICY "clinical update vitals" ON public.vitals FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse']::public.app_role[]));
CREATE POLICY "clinical delete vitals" ON public.vitals FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "staff read allergies" ON public.allergies;
DROP POLICY IF EXISTS "staff insert allergies" ON public.allergies;
DROP POLICY IF EXISTS "staff update allergies" ON public.allergies;
DROP POLICY IF EXISTS "staff delete allergies" ON public.allergies;
CREATE POLICY "staff read allergies" ON public.allergies FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "clinical insert allergies" ON public.allergies FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse']::public.app_role[]));
CREATE POLICY "clinical update allergies" ON public.allergies FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse']::public.app_role[]));
CREATE POLICY "clinical delete allergies" ON public.allergies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "staff read documents" ON public.documents;
DROP POLICY IF EXISTS "staff insert documents" ON public.documents;
DROP POLICY IF EXISTS "staff update documents" ON public.documents;
DROP POLICY IF EXISTS "staff delete documents" ON public.documents;
CREATE POLICY "staff read documents" ON public.documents FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "clinical insert documents" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse']::public.app_role[]));
CREATE POLICY "clinical update documents" ON public.documents FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse']::public.app_role[]));
CREATE POLICY "clinical delete documents" ON public.documents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- CLAIMS  (read: admin/doctor/receptionist · write: admin/receptionist)
-- ============================================================
DROP POLICY IF EXISTS "staff read claims" ON public.claims;
DROP POLICY IF EXISTS "staff insert claims" ON public.claims;
DROP POLICY IF EXISTS "staff update claims" ON public.claims;
CREATE POLICY "staff read claims" ON public.claims FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','receptionist']::public.app_role[]));
CREATE POLICY "billing insert claims" ON public.claims FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','receptionist']::public.app_role[]));
CREATE POLICY "billing update claims" ON public.claims FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','receptionist']::public.app_role[]));

-- ============================================================
-- BILLING: invoices / invoice_items / invoice_payments
-- (read: admin/doctor/receptionist · write: admin/receptionist)
-- ============================================================
DROP POLICY IF EXISTS "staff read invoices" ON public.invoices;
DROP POLICY IF EXISTS "staff insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "staff update invoices" ON public.invoices;
CREATE POLICY "staff read invoices" ON public.invoices FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','receptionist']::public.app_role[]));
CREATE POLICY "billing insert invoices" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','receptionist']::public.app_role[]));
CREATE POLICY "billing update invoices" ON public.invoices FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','receptionist']::public.app_role[]));

DROP POLICY IF EXISTS "staff read invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "staff insert invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "staff update invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "staff delete invoice_items" ON public.invoice_items;
CREATE POLICY "staff read invoice_items" ON public.invoice_items FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','receptionist']::public.app_role[]));
CREATE POLICY "billing insert invoice_items" ON public.invoice_items FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','receptionist']::public.app_role[]));
CREATE POLICY "billing update invoice_items" ON public.invoice_items FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','receptionist']::public.app_role[]));
CREATE POLICY "billing delete invoice_items" ON public.invoice_items FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','receptionist']::public.app_role[]));

DROP POLICY IF EXISTS "staff read invoice_payments" ON public.invoice_payments;
DROP POLICY IF EXISTS "staff insert invoice_payments" ON public.invoice_payments;
CREATE POLICY "staff read invoice_payments" ON public.invoice_payments FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','receptionist']::public.app_role[]));
CREATE POLICY "billing insert invoice_payments" ON public.invoice_payments FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','receptionist']::public.app_role[]));

-- ============================================================
-- MESSAGING  (staff read: admin/doctor/nurse/receptionist · staff write: admin/doctor/nurse)
-- Patient own-conversation policies remain untouched.
-- ============================================================
DROP POLICY IF EXISTS "staff read conversations" ON public.conversations;
DROP POLICY IF EXISTS "staff insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "staff update conversations" ON public.conversations;
CREATE POLICY "staff read conversations" ON public.conversations FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','receptionist']::public.app_role[]));
CREATE POLICY "staff insert conversations" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse']::public.app_role[]));
CREATE POLICY "staff update conversations" ON public.conversations FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse']::public.app_role[]));

DROP POLICY IF EXISTS "staff read messages" ON public.messages;
DROP POLICY IF EXISTS "staff insert messages" ON public.messages;
DROP POLICY IF EXISTS "staff update messages" ON public.messages;
CREATE POLICY "staff read messages" ON public.messages FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','receptionist']::public.app_role[]));
CREATE POLICY "staff insert messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse']::public.app_role[]));
CREATE POLICY "staff update messages" ON public.messages FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse']::public.app_role[]));

-- ============================================================
-- OPERATIONS: rooms, provider_schedules, waitlist
-- ============================================================
DROP POLICY IF EXISTS "staff read rooms" ON public.rooms;
DROP POLICY IF EXISTS "staff insert rooms" ON public.rooms;
DROP POLICY IF EXISTS "staff update rooms" ON public.rooms;
CREATE POLICY "staff read rooms" ON public.rooms FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "admin insert rooms" ON public.rooms FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update rooms" ON public.rooms FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "staff read schedules" ON public.provider_schedules;
DROP POLICY IF EXISTS "staff insert schedules" ON public.provider_schedules;
DROP POLICY IF EXISTS "staff update schedules" ON public.provider_schedules;
CREATE POLICY "staff read schedules" ON public.provider_schedules FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "admin insert schedules" ON public.provider_schedules FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update schedules" ON public.provider_schedules FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "staff read waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "staff insert waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "staff update waitlist" ON public.waitlist;
CREATE POLICY "staff read waitlist" ON public.waitlist FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','receptionist']::public.app_role[]));
CREATE POLICY "staff insert waitlist" ON public.waitlist FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','receptionist']::public.app_role[]));
CREATE POLICY "staff update waitlist" ON public.waitlist FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor','nurse','receptionist']::public.app_role[]));

-- ============================================================
-- PROVIDERS  (read stays open to authenticated — portal shows provider
-- names on appointments · write: admin only)
-- ============================================================
DROP POLICY IF EXISTS "staff insert providers" ON public.providers;
DROP POLICY IF EXISTS "staff update providers" ON public.providers;
CREATE POLICY "admin insert providers" ON public.providers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update providers" ON public.providers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- PATIENT_USERS LINKS  (staff manage: admin/receptionist · patient reads own — untouched)
-- ============================================================
DROP POLICY IF EXISTS "staff insert links" ON public.patient_users;
DROP POLICY IF EXISTS "staff update links" ON public.patient_users;
CREATE POLICY "staff insert links" ON public.patient_users FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','receptionist']::public.app_role[]));
CREATE POLICY "staff update links" ON public.patient_users FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','receptionist']::public.app_role[]));
-- Staff read of links is needed for role management screens:
DROP POLICY IF EXISTS "staff read links" ON public.patient_users;
CREATE POLICY "staff read links" ON public.patient_users FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- ============================================================
-- AUDIT LOGS  (read: admin/doctor — mirrors audit.read · insert: own rows, any authenticated,
-- so denied-access attempts by any account are still recorded)
-- ============================================================
DROP POLICY IF EXISTS "staff read audit" ON public.audit_logs;
CREATE POLICY "staff read audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','doctor']::public.app_role[]));
-- "staff insert audit" (user_id = auth.uid()) stays as-is: correctly scoped.
