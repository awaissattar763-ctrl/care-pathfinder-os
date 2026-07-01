import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMyPatient } from "@/hooks/portal-queries";
import { useSessionLog } from "@/hooks/portal-queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { User as UserIcon, Shield, Activity, Save } from "lucide-react";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/portal/profile")({ component: PortalProfile });

function PortalProfile() {
  const { data: patient } = useMyPatient();
  const { user } = useAuth();
  const { data: sessions } = useSessionLog(20);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patient) { setPhone(patient.phone ?? ""); setAddress(patient.address ?? ""); }
  }, [patient]);

  if (!patient) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("patients").update({ phone, address }).eq("id", patient.id);
      if (error) throw error;
      await logAudit("patient.profile.update", "patient", patient.id, { phone: !!phone, address: !!address });
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><UserIcon className="size-5 text-primary" /> Profile & security</h1>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">Account</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Name</dt><dd>{patient.name}</dd>
          <dt className="text-muted-foreground">MRN</dt><dd>{patient.mrn}</dd>
          <dt className="text-muted-foreground">Email</dt><dd className="truncate">{user?.email}</dd>
          <dt className="text-muted-foreground">DOB</dt><dd>{patient.dob ?? "—"}</dd>
        </dl>
      </section>

      <form onSubmit={onSave} className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">Contact information</h2>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40" />
        </div>
        <button type="submit" disabled={saving}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
          <Save className="size-4" /> Save changes
        </button>
      </form>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Activity className="size-4" /> Recent activity</h2>
        {(sessions ?? []).length === 0 ? (
          <div className="text-sm text-muted-foreground">No activity recorded yet.</div>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {(sessions ?? []).map((s) => (
              <li key={s.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium capitalize">{s.event.replaceAll("_", " ")}</div>
                  <div className="text-xs text-muted-foreground">{s.user_agent ?? "Unknown device"}</div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-2"><Shield className="size-4 text-success" /> Security</h2>
        <p className="text-xs text-muted-foreground">Your session is protected by HIPAA-grade encryption (AES-256). Contact your clinic to revoke active sessions.</p>
      </section>
    </div>
  );
}