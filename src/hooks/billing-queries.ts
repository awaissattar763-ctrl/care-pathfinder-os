import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/hooks/use-auth";

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];
export type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"];
export type InvoicePayment = Database["public"]["Tables"]["invoice_payments"]["Row"];

export type InvoiceWithRefs = Invoice & {
  patient: { id: string; name: string; mrn: string | null } | null;
  provider: { id: string; name: string } | null;
  items: InvoiceItem[];
  payments: InvoicePayment[];
};

export const INVOICE_STATUSES = ["draft", "sent", "pending", "partially_paid", "paid", "overdue", "voided"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  pending: "Pending",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
  voided: "Voided",
};

export const SERVICE_TYPES = ["appointment", "telemedicine", "lab", "prescription", "procedure", "other"] as const;
export const SERVICE_LABELS: Record<string, string> = {
  appointment: "Appointment",
  telemedicine: "Telemedicine",
  lab: "Lab",
  prescription: "Prescription",
  procedure: "Procedure",
  other: "Other",
};

/** Overdue is derived: an unpaid, non-voided invoice past its due date. */
export function effectiveStatus(inv: Pick<Invoice, "status" | "due_date">): InvoiceStatus {
  const open = ["sent", "pending", "partially_paid"].includes(inv.status);
  if (open && new Date(inv.due_date) < new Date(new Date().toDateString())) return "overdue";
  return inv.status as InvoiceStatus;
}

export function balanceDue(inv: Pick<Invoice, "total" | "amount_paid">) {
  return Math.max(0, Number(inv.total) - Number(inv.amount_paid));
}

export function money(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const SELECT_WITH_REFS =
  "*, patient:patients(id,name,mrn), provider:providers(id,name), items:invoice_items(*), payments:invoice_payments(*)";

// ---------- QUERIES ----------

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(SELECT_WITH_REFS)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as InvoiceWithRefs[];
    },
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ["invoices", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(SELECT_WITH_REFS)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as InvoiceWithRefs;
    },
  });
}

/** Activity timeline + audit trail for one invoice, straight from audit_logs. */
export function useInvoiceActivity(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["invoices", invoiceId, "activity"],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity", "invoice")
        .eq("entity_id", invoiceId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Uninvoiced-friendly charge sources for a patient: appointments, labs, prescriptions. */
export function usePatientBillables(patientId: string | undefined) {
  return useQuery({
    queryKey: ["billables", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const [appts, labs, rx] = await Promise.all([
        supabase
          .from("appointments")
          .select("id, scheduled_at, visit_type, reason, status")
          .eq("patient_id", patientId!)
          .order("scheduled_at", { ascending: false })
          .limit(20),
        supabase
          .from("lab_orders")
          .select("id, order_number, ordered_at, status, tests:lab_order_tests(test_name)")
          .eq("patient_id", patientId!)
          .order("ordered_at", { ascending: false })
          .limit(20),
        supabase
          .from("prescriptions")
          .select("id, rx_number, drug, created_at, status")
          .eq("patient_id", patientId!)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (appts.error) throw appts.error;
      if (labs.error) throw labs.error;
      if (rx.error) throw rx.error;
      return {
        appointments: appts.data ?? [],
        labOrders: (labs.data ?? []) as Array<{
          id: string; order_number: string; ordered_at: string; status: string;
          tests: Array<{ test_name: string }>;
        }>,
        prescriptions: rx.data ?? [],
      };
    },
  });
}

// ---------- MUTATIONS ----------

export function useCreateInvoice() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      patient_id: string;
      provider_id?: string | null;
      due_date?: string;
      notes?: string | null;
      adjustment?: number;
      items: Array<Pick<InvoiceItemInsert, "description" | "service_type" | "reference_id" | "quantity" | "unit_price">>;
    }) => {
      const { items, adjustment = 0, ...invoice } = input;
      const { data: inv, error } = await supabase
        .from("invoices")
        .insert({ ...invoice, adjustment, created_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      if (items.length > 0) {
        const { error: itemErr } = await supabase
          .from("invoice_items")
          .insert(items.map((it) => ({ ...it, invoice_id: inv.id })));
        if (itemErr) throw itemErr;
      }
      await logAudit("invoice.create", "invoice", inv.id, {
        invoice_number: inv.invoice_number,
        items: items.length,
      });
      return inv;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create invoice"),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch, action = "invoice.update" }: {
      id: string;
      patch: Database["public"]["Tables"]["invoices"]["Update"];
      action?: string;
    }) => {
      const { data, error } = await supabase.from("invoices").update(patch).eq("id", id).select().single();
      if (error) throw error;
      await logAudit(action, "invoice", id, patch as Record<string, unknown>);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update invoice"),
  });
}

export function useVoidInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "voided", void_reason: reason, voided_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await logAudit("invoice.void", "invoice", id, { reason });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice voided");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not void invoice"),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      invoice_id: string;
      amount: number;
      method: string;
      reference?: string | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("invoice_payments")
        .insert({ ...input, recorded_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      await logAudit("invoice.payment", "invoice", input.invoice_id, {
        amount: input.amount,
        method: input.method,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment recorded");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not record payment"),
  });
}

export function useAddInvoiceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: InvoiceItemInsert) => {
      const { error } = await supabase.from("invoice_items").insert(item);
      if (error) throw error;
      await logAudit("invoice.item_add", "invoice", item.invoice_id, { description: item.description });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add line item"),
  });
}

export function useRemoveInvoiceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, invoice_id }: { id: string; invoice_id: string }) => {
      const { error } = await supabase.from("invoice_items").delete().eq("id", id);
      if (error) throw error;
      await logAudit("invoice.item_remove", "invoice", invoice_id, { item_id: id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove line item"),
  });
}

// ---------- DERIVED ANALYTICS (computed from real persisted data) ----------

export function billingStats(invoices: InvoiceWithRefs[]) {
  const live = invoices.filter((i) => i.status !== "voided" && i.status !== "draft");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalRevenue = live.reduce((s, i) => s + Number(i.amount_paid), 0);
  const outstanding = live.reduce((s, i) => s + balanceDue(i), 0);
  const paidThisMonth = live
    .flatMap((i) => i.payments)
    .filter((p) => new Date(p.paid_at) >= monthStart)
    .reduce((s, p) => s + Number(p.amount), 0);
  const overdue = live.filter((i) => effectiveStatus(i) === "overdue");
  const billed = live.reduce((s, i) => s + Number(i.total), 0);
  const collectionRate = billed > 0 ? (totalRevenue / billed) * 100 : 0;
  const avgValue = live.length > 0 ? billed / live.length : 0;

  return {
    totalRevenue,
    outstanding,
    paidThisMonth,
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((s, i) => s + balanceDue(i), 0),
    collectionRate,
    avgValue,
    invoiceCount: live.length,
  };
}

export function revenueByMonth(invoices: InvoiceWithRefs[], months = 12) {
  const buckets = new Map<string, { label: string; collected: number; billed: number }>();
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    buckets.set(key, { label: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }), collected: 0, billed: 0 });
  }
  for (const inv of invoices) {
    if (inv.status === "voided") continue;
    const issued = new Date(inv.issue_date);
    const bKey = `${issued.getFullYear()}-${issued.getMonth()}`;
    const b = buckets.get(bKey);
    if (b && inv.status !== "draft") b.billed += Number(inv.total);
    for (const p of inv.payments) {
      const pd = new Date(p.paid_at);
      const pKey = `${pd.getFullYear()}-${pd.getMonth()}`;
      const pb = buckets.get(pKey);
      if (pb) pb.collected += Number(p.amount);
    }
  }
  return Array.from(buckets.values());
}

export function revenueByProvider(invoices: InvoiceWithRefs[]) {
  const m = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.status === "voided") continue;
    const name = inv.provider?.name ?? "Unassigned";
    m.set(name, (m.get(name) ?? 0) + Number(inv.amount_paid));
  }
  return Array.from(m.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function revenueByServiceType(invoices: InvoiceWithRefs[]) {
  const m = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.status === "voided" || Number(inv.total) <= 0) continue;
    // attribute collected cash proportionally across the invoice's line items
    const ratio = Number(inv.amount_paid) / Number(inv.total);
    for (const it of inv.items) {
      const key = SERVICE_LABELS[it.service_type] ?? it.service_type;
      m.set(key, (m.get(key) ?? 0) + Number(it.amount) * ratio);
    }
  }
  return Array.from(m.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function topPayingPatients(invoices: InvoiceWithRefs[], limit = 8) {
  const m = new Map<string, { name: string; mrn: string | null; paid: number; outstanding: number; invoices: number }>();
  for (const inv of invoices) {
    if (inv.status === "voided" || !inv.patient) continue;
    const cur = m.get(inv.patient.id) ?? { name: inv.patient.name, mrn: inv.patient.mrn, paid: 0, outstanding: 0, invoices: 0 };
    cur.paid += Number(inv.amount_paid);
    cur.outstanding += balanceDue(inv);
    cur.invoices += 1;
    m.set(inv.patient.id, cur);
  }
  return Array.from(m.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.paid - a.paid)
    .slice(0, limit);
}
