import { money, STATUS_LABELS, SERVICE_LABELS, effectiveStatus, balanceDue, type InvoiceWithRefs } from "@/hooks/billing-queries";

function esc(s: string | null | undefined) {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtDate(d: string | null | undefined) {
  return d ? new Date(d).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "—";
}

/**
 * Opens a clinic-branded, print-ready invoice in a new window.
 * The browser's print dialog handles both "Print" and "Save as PDF" —
 * professional output with zero added dependencies.
 */
export function printInvoice(inv: InvoiceWithRefs) {
  const status = effectiveStatus(inv);
  const due = balanceDue(inv);

  const rows = inv.items
    .map(
      (it) => `
      <tr>
        <td>
          <div class="desc">${esc(it.description)}</div>
          <div class="svc">${esc(SERVICE_LABELS[it.service_type] ?? it.service_type)}</div>
        </td>
        <td class="num">${Number(it.quantity)}</td>
        <td class="num">${money(Number(it.unit_price))}</td>
        <td class="num">${money(Number(it.amount))}</td>
      </tr>`,
    )
    .join("");

  const payments = inv.payments
    .map(
      (p) => `
      <tr>
        <td>${fmtDate(p.paid_at)}</td>
        <td>${esc(p.method.replace("_", " "))}</td>
        <td>${esc(p.reference) || "—"}</td>
        <td class="num">${money(Number(p.amount))}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice ${esc(inv.invoice_number)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Segoe UI", -apple-system, Helvetica, Arial, sans-serif; color: #1a1d23; padding: 48px; font-size: 13px; line-height: 1.5; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 24px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 20px; }
  .brand h1 { font-size: 20px; letter-spacing: -0.3px; }
  .brand p { color: #6b7280; font-size: 11px; }
  .inv-meta { text-align: right; }
  .inv-meta .no { font-size: 18px; font-weight: 700; letter-spacing: 0.3px; }
  .badge { display: inline-block; margin-top: 6px; padding: 3px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; }
  .badge.paid { background: #dcfce7; color: #15803d; }
  .badge.overdue { background: #fee2e2; color: #b91c1c; }
  .badge.voided { background: #f3f4f6; color: #6b7280; }
  .badge.other { background: #dbeafe; color: #1d4ed8; }
  .parties { display: flex; justify-content: space-between; margin: 28px 0; }
  .parties h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 6px; }
  .parties .name { font-weight: 600; font-size: 14px; }
  .parties .sub { color: #6b7280; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; padding: 8px 10px; border-bottom: 2px solid #e5e7eb; }
  td { padding: 10px; border-bottom: 1px solid #f0f1f3; vertical-align: top; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .desc { font-weight: 500; }
  .svc { font-size: 11px; color: #9ca3af; }
  .totals { margin-top: 16px; margin-left: auto; width: 280px; }
  .totals .row { display: flex; justify-content: space-between; padding: 5px 10px; }
  .totals .grand { border-top: 2px solid #1a1d23; margin-top: 6px; padding-top: 10px; font-weight: 700; font-size: 15px; }
  .totals .due { color: ${due > 0 && status !== "voided" ? "#b91c1c" : "#15803d"}; font-weight: 700; }
  h2.sec { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin: 32px 0 4px; }
  .notes { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; margin-top: 28px; color: #4b5563; }
  .foot { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; color: #9ca3af; font-size: 11px; }
  .void-stamp { position: fixed; top: 38%; left: 50%; transform: translate(-50%, -50%) rotate(-22deg); font-size: 90px; font-weight: 800; color: rgba(220, 38, 38, 0.14); letter-spacing: 12px; pointer-events: none; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  ${status === "voided" ? '<div class="void-stamp">VOIDED</div>' : ""}
  <div class="head">
    <div class="brand">
      <div class="logo">H</div>
      <div>
        <h1>HealthOS Medical Practice</h1>
        <p>1200 Care Avenue · Suite 400 · billing@healthos.example · (555) 014-2200</p>
      </div>
    </div>
    <div class="inv-meta">
      <div class="no">${esc(inv.invoice_number)}</div>
      <div class="badge ${status === "paid" ? "paid" : status === "overdue" ? "overdue" : status === "voided" ? "voided" : "other"}">${esc(STATUS_LABELS[status])}</div>
    </div>
  </div>

  <div class="parties">
    <div>
      <h3>Billed to</h3>
      <div class="name">${esc(inv.patient?.name ?? "—")}</div>
      <div class="sub">MRN ${esc(inv.patient?.mrn ?? "—")}</div>
    </div>
    <div>
      <h3>Provider</h3>
      <div class="name">${esc(inv.provider?.name ?? "—")}</div>
    </div>
    <div style="text-align:right">
      <h3>Dates</h3>
      <div class="sub">Issued: <b>${fmtDate(inv.issue_date)}</b></div>
      <div class="sub">Due: <b>${fmtDate(inv.due_date)}</b></div>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Description</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th></tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="4" style="color:#9ca3af">No line items</td></tr>'}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${money(Number(inv.subtotal))}</span></div>
    ${Number(inv.adjustment) !== 0 ? `<div class="row"><span>Adjustment</span><span>${money(Number(inv.adjustment))}</span></div>` : ""}
    <div class="row grand"><span>Total</span><span>${money(Number(inv.total))}</span></div>
    <div class="row"><span>Paid</span><span>${money(Number(inv.amount_paid))}</span></div>
    <div class="row due"><span>Balance due</span><span>${money(due)}</span></div>
  </div>

  ${payments ? `<h2 class="sec">Payment history</h2>
  <table>
    <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th class="num">Amount</th></tr></thead>
    <tbody>${payments}</tbody>
  </table>` : ""}

  ${inv.notes ? `<div class="notes"><b>Notes:</b> ${esc(inv.notes)}</div>` : ""}

  <div class="foot">
    <span>Thank you for choosing HealthOS Medical Practice.</span>
    <span>Generated ${new Date().toLocaleString()}</span>
  </div>
  <script>window.onload = function(){ window.print(); };</script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
