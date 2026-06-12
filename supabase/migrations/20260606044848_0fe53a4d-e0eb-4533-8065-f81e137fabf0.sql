
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','doctor','nurse','receptionist','lab_tech')
  )
$$;

CREATE TABLE public.patient_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  patient_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_users TO authenticated;
GRANT ALL ON public.patient_users TO service_role;
ALTER TABLE public.patient_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patient reads own link" ON public.patient_users FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "staff insert links" ON public.patient_users FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update links" ON public.patient_users FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "admin delete links" ON public.patient_users FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.current_patient_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT patient_id FROM public.patient_users WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  provider_id uuid,
  subject text NOT NULL DEFAULT 'New conversation',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read conversations" ON public.conversations FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert conversations" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update conversations" ON public.conversations FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "admin delete conversations" ON public.conversations FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "patient read own conversations" ON public.conversations FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());
CREATE POLICY "patient create own conversation" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (patient_id = public.current_patient_id());

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_user_id uuid NOT NULL,
  sender_role text NOT NULL,
  body text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read messages" ON public.messages FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) AND sender_user_id = auth.uid());
CREATE POLICY "staff update messages" ON public.messages FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "patient read own messages" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.patient_id = public.current_patient_id()));
CREATE POLICY "patient send own messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.patient_id = public.current_patient_id())
  );
CREATE POLICY "patient update own read receipt" ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.patient_id = public.current_patient_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.patient_id = public.current_patient_id()));

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);

CREATE TABLE public.user_sessions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event text NOT NULL,
  ip text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.user_sessions_log TO authenticated;
GRANT ALL ON public.user_sessions_log TO service_role;
ALTER TABLE public.user_sessions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user reads own session log" ON public.user_sessions_log FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "user inserts own session log" ON public.user_sessions_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin insert roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "patient reads own record" ON public.patients FOR SELECT TO authenticated
  USING (id = public.current_patient_id());
CREATE POLICY "patient updates own record" ON public.patients FOR UPDATE TO authenticated
  USING (id = public.current_patient_id()) WITH CHECK (id = public.current_patient_id());

CREATE POLICY "patient reads own appts" ON public.appointments FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());
CREATE POLICY "patient reads own rx" ON public.prescriptions FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());
CREATE POLICY "patient reads own lab orders" ON public.lab_orders FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());
CREATE POLICY "patient reads own lab order tests" ON public.lab_order_tests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.lab_orders o WHERE o.id = order_id AND o.patient_id = public.current_patient_id()));
CREATE POLICY "patient reads own lab results" ON public.lab_results FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());
CREATE POLICY "patient reads own soap" ON public.soap_notes FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());
CREATE POLICY "patient reads own allergies" ON public.allergies FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());
CREATE POLICY "patient reads own vitals" ON public.vitals FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());
CREATE POLICY "patient reads own documents" ON public.documents FOR SELECT TO authenticated
  USING (patient_id = public.current_patient_id());

CREATE OR REPLACE FUNCTION public.bump_conversation_last_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_bump_conversation
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_last_message();
