
CREATE TABLE public.lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  provider_id uuid,
  order_number text NOT NULL DEFAULT ('LAB-' || lpad(((floor(random()*9000)+1000)::int)::text, 4, '0')),
  status text NOT NULL DEFAULT 'ordered',
  priority text NOT NULL DEFAULT 'routine',
  lab_facility text,
  clinical_notes text,
  ordered_at timestamptz NOT NULL DEFAULT now(),
  collected_at timestamptz,
  resulted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_orders TO authenticated;
GRANT ALL ON public.lab_orders TO service_role;
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read lab_orders" ON public.lab_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert lab_orders" ON public.lab_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update lab_orders" ON public.lab_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete lab_orders" ON public.lab_orders FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER lab_orders_updated_at BEFORE UPDATE ON public.lab_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_lab_orders_patient ON public.lab_orders(patient_id);
CREATE INDEX idx_lab_orders_status ON public.lab_orders(status);

CREATE TABLE public.lab_order_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.lab_orders(id) ON DELETE CASCADE,
  test_code text,
  test_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_order_tests TO authenticated;
GRANT ALL ON public.lab_order_tests TO service_role;
ALTER TABLE public.lab_order_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read lab_order_tests" ON public.lab_order_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert lab_order_tests" ON public.lab_order_tests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update lab_order_tests" ON public.lab_order_tests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete lab_order_tests" ON public.lab_order_tests FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_lab_order_tests_order ON public.lab_order_tests(order_id);

CREATE TABLE public.lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.lab_orders(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  test_code text,
  test_name text NOT NULL,
  value text NOT NULL,
  unit text,
  reference_range text,
  flag text NOT NULL DEFAULT 'normal',
  resulted_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_results TO authenticated;
GRANT ALL ON public.lab_results TO service_role;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read lab_results" ON public.lab_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert lab_results" ON public.lab_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update lab_results" ON public.lab_results FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete lab_results" ON public.lab_results FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_lab_results_order ON public.lab_results(order_id);
CREATE INDEX idx_lab_results_patient ON public.lab_results(patient_id);
