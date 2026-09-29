"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "bookings", label: "Bookings" },
  { key: "contacts", label: "Contacts" },
  { key: "support", label: "Support" },
  { key: "grievances", label: "Grievances" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type Summary = {
  bookings: number;
  contacts: number;
  support: number;
  grievances: number;
  paidBookings: number;
  pendingPayments: number;
};

type RecordItem = Record<string, unknown> & {
  reference?: string;
  ticketReference?: string;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
};

const STATUS_OPTIONS: Record<TabKey, string[]> = {
  bookings: ["", "pending", "paid", "pending_payment", "cancelled", "refunded"],
  contacts: ["", "new", "reviewed", "archived"],
  support: ["", "new", "reviewing", "matched", "closed"],
  grievances: ["", "open", "in_review", "resolved", "closed"],
};

function labelStatus(value: unknown) {
  return String(value || "unknown").replaceAll("_", " ");
}

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function formatAmount(item: RecordItem) {
  if (typeof item.paymentAmount !== "number") return "—";
  const currency = typeof item.paymentCurrency === "string" ? item.paymentCurrency : "USD";
  return `${currency} ${(item.paymentAmount / 100).toFixed(2)}`;
}

export default function AdminDashboard() {
  const [tab, setTab] = React.useState<TabKey>("bookings");
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [items, setItems] = React.useState<RecordItem[]>([]);
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [paying, setPaying] = React.useState<RecordItem | null>(null);
  const [transactionId, setTransactionId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ type: tab, limit: "100" });
        if (q.trim()) params.set("q", q.trim());
        if (status) params.set("status", status);
        const response = await fetch(`/api/admin/data?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as { ok?: boolean; items?: RecordItem[]; error?: string } | null;
        if (response.status === 401) {
          window.location.reload();
          return;
        }
        if (!response.ok || !data?.ok) throw new Error(data?.error || "Unable to load records.");
        if (!cancelled) setItems(data.items || []);
      } catch (err) {
        if (!cancelled && !(err instanceof DOMException && err.name === "AbortError")) {
          setError(err instanceof Error ? err.message : "Unable to load records.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [tab, q, status, refreshToken]);

  React.useEffect(() => {
    let cancelled = false;
    async function loadSummary() {
      try {
        const response = await fetch("/api/admin/data?type=summary", { cache: "no-store" });
        const data = (await response.json().catch(() => null)) as { ok?: boolean; summary?: Summary } | null;
        if (response.ok && data?.ok && !cancelled) setSummary(data.summary || null);
      } catch {
        // The table remains usable if the summary endpoint temporarily fails.
      }
    }
    void loadSummary();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  function changeTab(next: TabKey) {
    setTab(next);
    setStatus("");
    setQ("");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    window.location.reload();
  }

  async function markPaid() {
    if (!paying?.reference) return;
    const numericAmount = Number(amount);
    if (!transactionId.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setNotice("Enter the PayPal transaction ID and amount paid.");
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "booking",
          action: "mark_paid",
          reference: paying.reference,
          paymentReference: transactionId.trim(),
          amount: numericAmount,
          currency: "USD",
        }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Unable to mark payment as paid.");
      setPaying(null);
      setTransactionId("");
      setAmount("");
      setRefreshToken((value) => value + 1);
      setNotice("Payment marked as paid.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to update payment.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(reference: string, nextStatus: string) {
    setNotice(null);
    try {
      const response = await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tab === "grievances" ? "grievance" : tab === "contacts" ? "contact" : "support", action: "set_status", reference, status: nextStatus }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Unable to update status.");
      setRefreshToken((value) => value + 1);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to update status.");
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">GetSetGrades</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Admin dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manual operations and PayPal reconciliation.</p>
          </div>
          <Button variant="outline" onClick={logout}>Sign out</Button>
        </header>

        {summary && (
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[
              ["Bookings", summary.bookings],
              ["Paid", summary.paidBookings],
              ["Pending payment", summary.pendingPayments],
              ["Contacts", summary.contacts],
              ["Support", summary.support],
              ["Grievances", summary.grievances],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((item) => (
            <Button key={item.key} variant={tab === item.key ? "default" : "outline"} onClick={() => changeTab(item.key)}>
              {item.label}
            </Button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search reference, name, email…" className="sm:max-w-sm" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            {STATUS_OPTIONS[tab].map((value) => <option key={value} value={value}>{value ? labelStatus(value) : "All statuses"}</option>)}
          </select>
          <Button variant="outline" onClick={() => setRefreshToken((value) => value + 1)}>Refresh</Button>
        </div>

        {notice && <p className="mt-3 text-sm text-muted-foreground" role="status">{notice}</p>}
        {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}

        <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
          {loading ? (
            <div className="p-8 text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground">No records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Person</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const reference = String(item.reference || item.ticketReference || "");
                    const person = String(item.fullName || item.name || "—");
                    const details = tab === "bookings"
                      ? `${String(item.service || "")} · ${String(item.sessionLength || "")}`
                      : String(item.subject || item.service || "—");
                    return (
                      <tr key={String(item.id || reference)} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-mono text-xs">{reference}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{person}</div>
                          <div className="text-xs text-muted-foreground">{String(item.email || "—")}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{details}</div>
                          {tab === "bookings" && <div className="mt-1 text-xs text-muted-foreground">Payment: {labelStatus(item.paymentStatus)} · {formatAmount(item)}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", item.status === "paid" || item.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground")}>
                            {labelStatus(item.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(item.createdAt)}</td>
                        <td className="px-4 py-3">
                          {tab === "bookings" ? (
                            <Button size="sm" variant="outline" disabled={item.paymentStatus === "paid"} onClick={() => { setPaying(item); setTransactionId(""); setAmount(""); setNotice(null); }}>
                              {item.paymentStatus === "paid" ? "Paid" : "Mark paid"}
                            </Button>
                          ) : (
                            <select
                              value={String(item.status || "")}
                              onChange={(event) => void updateStatus(reference, event.target.value)}
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                            >
                              {STATUS_OPTIONS[tab].filter(Boolean).map((option) => <option key={option} value={option}>{labelStatus(option)}</option>)}
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {paying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-label="Mark PayPal payment as paid">
          <div className="w-full max-w-md rounded-3xl border border-border bg-background p-6 shadow-xl">
            <h2 className="text-xl font-semibold">Mark PayPal payment as paid</h2>
            <p className="mt-1 text-sm text-muted-foreground">Booking {paying.reference}. Confirm the transaction from PayPal before saving.</p>
            <div className="mt-5 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                PayPal transaction ID
                <Input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="e.g. 8AB12345CD678901E" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Amount paid (USD)
                <Input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPaying(null)} disabled={saving}>Cancel</Button>
              <Button onClick={() => void markPaid()} disabled={saving}>{saving ? "Saving…" : "Mark paid"}</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
