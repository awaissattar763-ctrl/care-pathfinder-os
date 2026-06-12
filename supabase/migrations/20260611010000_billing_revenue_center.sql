-- ============ BILLING & REVENUE CENTER ============

-- ---------- INVOICES ----------
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE
    DEFAULT ('INV-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random()*90000)+10000)::int::text, 5, '0')),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','pending','partially_paid','paid','overdue','voided')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  adjustment NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  void_reason TEXT,
  voided_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- INVOICE LINE ITEMS ----------
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL DEFAULT 'other'
    CHECK (service_type IN ('appointment','telemedicine','lab','prescription','procedure','other')),
  description TEXT NOT NULL,
  reference_id UUID,             -- optional link: appointment / lab_order / prescription id
  quantity NUMERIC(8,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- PAYMENTS ----------
CREATE TABLE public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL DEFAULT 'card'
    CHECK (method IN ('cash','card','bank_transfer','check','insurance','other')),
  reference TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- INDEXES ----------
CREATE INDEX idx_invoices_patient ON public.invoices(patient_id);
CREATE INDEX idx_invoices_status_due ON public.invoices(status, due_date);
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX idx_invoice_payments_invoice ON public.invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_paid_at ON public.invoice_payments(paid_at DESC);

-- ---------- TRIGGERS ----------
-- Keep invoice totals in sync with line items.
CREATE OR REPLACE FUNCTION public.recalc_invoice_totals()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv UUID;
BEGIN
  inv := COALESCE(NEW.invoice_id, OLD.invoice_id);
  UPDATE public.invoices i SET
    subtotal = COALESCE((SELECT SUM(amount) FROM public.invoice_items WHERE invoice_id = inv), 0),
    total    = COALESCE((SELECT SUM(amount) FROM public.invoice_items WHERE invoice_id = inv), 0) + i.adjustment,
    updated_at = now()
  WHERE i.id = inv;
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_invoice_items_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.recalc_invoice_totals();

-- Keep amount_paid + payment-driven status in sync with payments.
CREATE OR REPLACE FUNCTION public.recalc_invoice_payments()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv UUID; paid NUMERIC(12,2); tot NUMERIC(12,2); st TEXT;
BEGIN
  inv := COALESCE(NEW.invoice_id, OLD.invoice_id);
  SELECT COALESCE(SUM(amount), 0) INTO paid FROM public.invoice_payments WHERE invoice_id = inv;
  SELECT total, status INTO tot, st FROM public.invoices WHERE id = inv;
  UPDATE public.invoices SET
    amount_paid = paid,
    status = CASE
      WHEN st = 'voided' THEN st
      WHEN paid >= tot AND tot > 0 THEN 'paid'
      WHEN paid > 0 THEN 'partially_paid'
      ELSE st
    END,
    updated_at = now()
  WHERE id = inv;
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_invoice_payments_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_payments
FOR EACH ROW EXECUTE FUNCTION public.recalc_invoice_payments();

-- Recompute total when adjustment changes.
CREATE OR REPLACE FUNCTION public.recalc_invoice_adjustment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.adjustment IS DISTINCT FROM OLD.adjustment THEN
    NEW.total := NEW.subtotal + NEW.adjustment;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_invoices_adjustment
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.recalc_invoice_adjustment();

-- ---------- RLS (mirrors existing claims pattern: staff read/write, admin delete) ----------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_payments TO authenticated;
GRANT ALL ON public.invoices, public.invoice_items, public.invoice_payments TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update invoices" ON public.invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete invoices" ON public.invoices FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "staff read invoice_items" ON public.invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert invoice_items" ON public.invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update invoice_items" ON public.invoice_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "staff delete invoice_items" ON public.invoice_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "staff read invoice_payments" ON public.invoice_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert invoice_payments" ON public.invoice_payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admin delete invoice_payments" ON public.invoice_payments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
