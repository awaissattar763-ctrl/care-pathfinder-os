import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { errMsg, type Patient } from "./types";
import type { Database } from "@/integrations/supabase/types";
import type { InvoiceStatus, LineItemKind, PaymentMethod } from "@/lib/constants";

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
export type InvoiceLineItem = Database["public"]["Tables"]["invoice_line_items"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type CreditNote = Database["public"]["Tables"]["credit_notes"]["Row"];

export type InvoiceWithPatient = Invoice & {
  patient: Pick<Patient, "id" | "name" | "mrn"> | null;
};

/* ------------------------------------------------------------------ */
/* Invoices                                                            */
/* ------------------------------------------------------------------ */

export function useInvoices(filters?: { status?: InvoiceStatus; patientId?: string }) {
  return useQuery({
    queryKey: ["invoices", filters ?? {}],
    queryFn: async () => {
      let q = supabase
        .from("invoices")
        .select("*, patient:patients(id,name,mrn)")
        .order("issued_at", { ascending: false });
      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.patientId) q = q.eq("patient_id", filters.patientId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as InvoiceWithPatient[];
    },
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ["invoice", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, patient:patients(id,name,mrn,email,phone)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as (Invoice & { patient: Pick<Patient, "id" | "name" | "mrn" | "email" | "phone"> | null }) | null;
    },
  });
}

export function useInvoiceLineItems(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["invoice-line-items", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", invoiceId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as InvoiceLineItem[];
    },
  });
}

export function useInvoicePayments(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["invoice-payments", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("invoice_id", invoiceId!)
        .order("received_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Payment[];
    },
  });
}

async function recomputeInvoiceTotals(invoiceId: string) {
  const [{ data: items }, { data: pays }, { data: inv }] = await Promise.all([
    supabase.from("invoice_line_items").select("amount").eq("invoice_id", invoiceId),
    supabase.from("payments").select("amount").eq("invoice_id", invoiceId),
    supabase.from("invoices").select("tax,discount,status").eq("id", invoiceId).single(),
  ]);
  const subtotal = (items ?? []).reduce((s, i) => s + Number(i.amount || 0), 0);
  const tax = Number(inv?.tax ?? 0);
  const discount = Number(inv?.discount ?? 0);
  const total = Math.max(0, subtotal + tax - discount);
  const paid = (pays ?? []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const balance = Math.max(0, total - paid);
  let status = inv?.status ?? "Draft";
  if (status !== "Cancelled" && status !== "Refunded") {
    if (balance === 0 && total > 0) status = "Paid";
    else if (status === "Paid" && balance > 0) status = "Sent";
  }
  await supabase
    .from("invoices")
    .update({ subtotal, total, balance_due: balance, status })
    .eq("id", invoiceId);
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<InvoiceInsert, "id" | "invoice_number" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("invoices").insert(input).select().single();
      if (error) throw error;
      await logAudit("invoice.create", "invoice", data.id, { patient_id: input.patient_id });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
    onError: (e) => toast.error(errMsg(e, "Could not create invoice")),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Invoice> }) => {
      const { data, error } = await supabase.from("invoices").update(patch).eq("id", id).select().single();
      if (error) throw error;
      await recomputeInvoiceTotals(id);
      await logAudit("invoice.update", "invoice", id, patch as Record<string, unknown>);
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice", v.id] });
    },
    onError: (e) => toast.error(errMsg(e, "Could not update invoice")),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
      await logAudit("invoice.delete", "invoice", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
    onError: (e) => toast.error(errMsg(e, "Could not delete invoice")),
  });
}

/* ------------------------------------------------------------------ */
/* Line items                                                          */
/* ------------------------------------------------------------------ */

export function useAddLineItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      invoice_id: string;
      kind: LineItemKind;
      description: string;
      quantity: number;
      unit_price: number;
      ref_id?: string | null;
    }) => {
      const amount = Number(input.quantity) * Number(input.unit_price);
      const { data, error } = await supabase
        .from("invoice_line_items")
        .insert({ ...input, amount })
        .select()
        .single();
      if (error) throw error;
      await recomputeInvoiceTotals(input.invoice_id);
      await logAudit("invoice.line_add", "invoice", input.invoice_id, { kind: input.kind, amount });
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["invoice-line-items", v.invoice_id] });
      qc.invalidateQueries({ queryKey: ["invoice", v.invoice_id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e) => toast.error(errMsg(e, "Could not add line item")),
  });
}

export function useDeleteLineItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, invoice_id }: { id: string; invoice_id: string }) => {
      const { error } = await supabase.from("invoice_line_items").delete().eq("id", id);
      if (error) throw error;
      await recomputeInvoiceTotals(invoice_id);
      await logAudit("invoice.line_remove", "invoice", invoice_id, { line_id: id });
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["invoice-line-items", v.invoice_id] });
      qc.invalidateQueries({ queryKey: ["invoice", v.invoice_id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e) => toast.error(errMsg(e, "Could not remove line item")),
  });
}

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      invoice_id: string;
      patient_id: string;
      amount: number;
      method: PaymentMethod;
      reference?: string | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase.from("payments").insert(input).select().single();
      if (error) throw error;
      await recomputeInvoiceTotals(input.invoice_id);
      await logAudit("payment.record", "payment", data.id, {
        invoice_id: input.invoice_id,
        amount: input.amount,
        method: input.method,
      });
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["invoice-payments", v.invoice_id] });
      qc.invalidateQueries({ queryKey: ["invoice", v.invoice_id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["billing-summary"] });
      toast.success("Payment recorded");
    },
    onError: (e) => toast.error(errMsg(e, "Could not record payment")),
  });
}

/* ------------------------------------------------------------------ */
/* Credit notes / refunds                                              */
/* ------------------------------------------------------------------ */

export function useIssueCreditNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      patient_id: string;
      invoice_id?: string | null;
      amount: number;
      reason?: string | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase.from("credit_notes").insert(input).select().single();
      if (error) throw error;
      if (input.invoice_id) {
        await supabase.from("invoices").update({ status: "Refunded" }).eq("id", input.invoice_id);
      }
      await logAudit("credit_note.issue", "credit_note", data.id, {
        invoice_id: input.invoice_id,
        amount: input.amount,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["credit-notes"] });
      qc.invalidateQueries({ queryKey: ["billing-summary"] });
      toast.success("Credit note issued");
    },
    onError: (e) => toast.error(errMsg(e, "Could not issue credit note")),
  });
}

export function useCreditNotes(patientId?: string) {
  return useQuery({
    queryKey: ["credit-notes", patientId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("credit_notes").select("*").order("issued_at", { ascending: false });
      if (patientId) q = q.eq("patient_id", patientId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CreditNote[];
    },
  });
}

/* ------------------------------------------------------------------ */
/* Dashboard aggregates                                                */
/* ------------------------------------------------------------------ */

export function useBillingSummary() {
  return useQuery({
    queryKey: ["billing-summary"],
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthIso = monthStart.toISOString();

      const [invAll, invMonth, payMonth, insMonth, outstanding] = await Promise.all([
        supabase.from("invoices").select("id,total,balance_due,status"),
        supabase.from("invoices").select("total").gte("issued_at", monthIso),
        supabase.from("payments").select("amount,method").gte("received_at", monthIso),
        supabase.from("claims").select("paid_amount").gte("submitted_at", monthIso),
        supabase.from("invoices").select("balance_due").in("status", ["Sent", "Overdue"]),
      ]);

      const revenueMTD = (invMonth.data ?? []).reduce((s, i) => s + Number(i.total || 0), 0);
      const collectionsMTD = (payMonth.data ?? []).reduce((s, p) => s + Number(p.amount || 0), 0);
      const insuranceRecoveryMTD = (insMonth.data ?? []).reduce((s, c) => s + Number(c.paid_amount || 0), 0);
      const outstandingTotal = (outstanding.data ?? []).reduce((s, i) => s + Number(i.balance_due || 0), 0);
      const invoiceCount = invAll.data?.length ?? 0;
      return {
        revenueMTD,
        collectionsMTD,
        insuranceRecoveryMTD,
        outstandingTotal,
        invoiceCount,
      };
    },
  });
}

export function useOutstandingBalance(patientId: string | undefined) {
  return useQuery({
    queryKey: ["outstanding-balance", patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("balance_due")
        .eq("patient_id", patientId!)
        .in("status", ["Sent", "Overdue", "Draft"]);
      if (error) throw error;
      return (data ?? []).reduce((s, i) => s + Number(i.balance_due || 0), 0);
    },
  });
}