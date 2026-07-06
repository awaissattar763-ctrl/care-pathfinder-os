import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Building2, Plus, Sparkles } from "lucide-react";
import { usePermissions } from "@/lib/rbac";
import {
  useClinics,
  useCreateClinic,
  useCreateDepartment,
  useUpdateClinic,
  useOrgFeatureFlags,
  useToggleFeature,
  useOrgSubscription,
  useSubscriptionPlans,
  useOrganizations,
} from "@/hooks/queries/tenant";

export const Route = createFileRoute("/settings/organization")({ component: OrgSettingsPage });

function OrgSettingsPage() {
  const perms = usePermissions();
  const canAdmin = perms.has("admin.users" as never);
  const { data: orgs = [] } = useOrganizations();
  const { data: clinics = [], isLoading } = useClinics();
  const { data: flags = [] } = useOrgFeatureFlags();
  const { data: subscription } = useOrgSubscription();
  const { data: plans = [] } = useSubscriptionPlans();
  const createClinic = useCreateClinic();
  const updateClinic = useUpdateClinic();
  const createDept = useCreateDepartment();
  const toggleFeature = useToggleFeature();

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDeptFor, setNewDeptFor] = useState<string | null>(null);
  const [newDept, setNewDept] = useState("");

  const primaryOrg = orgs[0];

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Organization"
        description="Manage your clinics, departments, subscription plan, and feature availability."
      />

      {/* Organization + Plan */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Organization</div>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="font-semibold">{primaryOrg?.name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">Timezone · {primaryOrg?.timezone ?? "UTC"}</div>
            </div>
          </div>
        </div>
        <div className="surface p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Subscription</div>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="font-semibold capitalize">
                {subscription && "plan" in subscription && subscription.plan
                  ? (subscription.plan as { name: string }).name
                  : "—"}
              </div>
              <div className="text-xs text-muted-foreground">
                {plans.length} plans available · status {subscription?.status ?? "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clinics */}
      <div className="surface mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="text-sm font-semibold">Clinics</div>
            <div className="text-xs text-muted-foreground">Multi-location practice management</div>
          </div>
          {canAdmin && primaryOrg && (
            <div className="flex items-center gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New clinic name"
                className="h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
              <input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="slug"
                className="h-9 px-3 rounded-lg bg-secondary text-sm outline-none focus:ring-2 focus:ring-ring/40 w-24"
              />
              <button
                className="btn btn-primary"
                disabled={!newName || !newSlug || createClinic.isPending}
                onClick={async () => {
                  await createClinic.mutateAsync({ org_id: primaryOrg.id, name: newName, slug: newSlug });
                  setNewName("");
                  setNewSlug("");
                }}
              >
                <Plus className="size-4" /> Add
              </button>
            </div>
          )}
        </div>
        {isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/70 text-muted-foreground text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Clinic</th>
                <th className="text-left font-semibold px-5 py-3">Timezone</th>
                <th className="text-left font-semibold px-5 py-3">Departments</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clinics.map((c) => (
                <tr key={c.id} className="table-row-hover align-top">
                  <td className="px-5 py-3.5">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.slug} · {c.org?.name}</div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{c.timezone}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {c.departments.map((d) => (
                        <span key={d.id} className="pill pill--neutral">{d.name}</span>
                      ))}
                      {c.departments.length === 0 && (
                        <span className="text-xs text-muted-foreground">No departments</span>
                      )}
                    </div>
                    {canAdmin && (
                      newDeptFor === c.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={newDept}
                            onChange={(e) => setNewDept(e.target.value)}
                            placeholder="Department"
                            className="h-7 px-2 rounded bg-secondary text-xs outline-none focus:ring-2 focus:ring-ring/40"
                          />
                          <button
                            className="text-xs text-primary hover:underline"
                            disabled={!newDept}
                            onClick={async () => {
                              await createDept.mutateAsync({ clinic_id: c.id, name: newDept });
                              setNewDept("");
                              setNewDeptFor(null);
                            }}
                          >
                            Save
                          </button>
                          <button className="text-xs text-muted-foreground" onClick={() => setNewDeptFor(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="text-xs text-primary hover:underline"
                          onClick={() => setNewDeptFor(c.id)}
                        >
                          + Add department
                        </button>
                      )
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={c.is_active}
                        disabled={!canAdmin}
                        onChange={(e) => updateClinic.mutate({ id: c.id, is_active: e.target.checked })}
                      />
                      {c.is_active ? "Active" : "Inactive"}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Feature flags */}
      <div className="surface">
        <div className="px-5 py-4 border-b border-border">
          <div className="text-sm font-semibold">Feature availability</div>
          <div className="text-xs text-muted-foreground">Toggle capabilities for this organization</div>
        </div>
        <div className="divide-y divide-border">
          {flags.map((f) => (
            <div key={f.code} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <div className="text-sm font-medium">{f.name}</div>
                <div className="text-xs text-muted-foreground">{f.description ?? f.code}</div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={f.effective}
                  disabled={!canAdmin || !primaryOrg}
                  onChange={(e) =>
                    primaryOrg &&
                    toggleFeature.mutate({ org_id: primaryOrg.id, flag_code: f.code, enabled: e.target.checked })
                  }
                />
                <span className="text-xs">{f.effective ? "Enabled" : "Disabled"}</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}