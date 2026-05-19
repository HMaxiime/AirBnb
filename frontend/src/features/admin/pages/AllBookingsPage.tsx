import { useState } from "react";
import { format } from "date-fns";
import numeral from "numeral";
import { usePendingListings } from "../hooks/usePendingListings";
import { useApprove } from "../hooks/useApprove";
import { useReject } from "../hooks/useReject";
import { useAllBookings } from "../hooks/useAllBookings";
import { Booking } from "../../../lib/api";
import { Spinner } from "../../../shared/components/Spinner";
import { AdminLayout } from "../components/AdminLayout";

// ── Status filter pills ───────────────────────────────────────────────────────

const FILTERS: Array<{ label: string; value: Booking["status"] | "all" }> = [
  { label: "All",       value: "all"       },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Pending",   value: "pending"   },
];

const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
};

// ── Reject reason modal ───────────────────────────────────────────────────────

interface RejectModal { listingId: string; listingTitle: string; reason: string }

// ── Page ──────────────────────────────────────────────────────────────────────

export function AllBookingsPage() {
  const [filter,      setFilter]      = useState<Booking["status"] | "all">("all");
  const [rejectModal, setRejectModal] = useState<RejectModal | null>(null);

  const { data: pending = [],  isLoading: loadingPending } = usePendingListings();
  const { data: bookings = [], isLoading: loadingBookings, isFetching } = useAllBookings(filter);
  const { mutate: approve, isPending: approving } = useApprove();
  const { mutate: reject,  isPending: rejecting  } = useReject();

  const isBusy = approving || rejecting;

  const handleReject = () => {
    if (!rejectModal?.reason.trim()) return;
    reject({ id: rejectModal.listingId, reason: rejectModal.reason.trim() }, { onSettled: () => setRejectModal(null) });
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-8">

        {/* ── Section 1: Listing Approvals ── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Listing Approvals</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {pending.length} pending
            </span>
          </div>

          {loadingPending ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : pending.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Queue is clear</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>All listings have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((l) => (
                <div key={l.id} className="rounded-2xl overflow-hidden shadow-sm"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex flex-col sm:flex-row gap-0">
                    <img src={l.img} alt={l.title} className="w-full h-36 sm:w-36 sm:h-28 object-cover flex-shrink-0" />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>{l.title}</h2>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {l.location} · {numeral(l.price).format("$0")}/night
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-light)" }}>
                            Host: <span style={{ color: "var(--text-muted)" }}>{l.hostName}</span>
                          </p>
                        </div>
                      </div>
                      {l.description && (
                        <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--text-muted)" }}>{l.description}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => approve(l.id)}
                          disabled={isBusy}
                          className="text-xs bg-emerald-500 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-600 disabled:opacity-50 font-semibold"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ listingId: l.id, listingTitle: l.title, reason: "" })}
                          disabled={isBusy}
                          className="text-xs border border-red-200 text-red-500 px-4 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 font-semibold"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
            System Report
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* ── Section 2: Booking Report ── */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>All Bookings</h2>
              {isFetching && <span className="text-xs text-[#ff5a5f]">Refreshing…</span>}
            </div>

            {/* Summary pills */}
            {!loadingBookings && (
              <div className="flex gap-3 text-xs font-semibold flex-wrap">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  {bookings.filter((b) => b.status === "confirmed").length} confirmed
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                  {bookings.filter((b) => b.status === "pending").length} pending
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                  {bookings.filter((b) => b.status === "cancelled").length} cancelled
                </span>
              </div>
            )}
          </div>

          {/* Status filters */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {FILTERS.map((f) => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                  filter === f.value
                    ? "bg-[#ff5a5f] text-white border-[#ff5a5f]"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                style={filter !== f.value ? { background: "var(--surface)", color: "var(--text)" } : {}}>
                {f.label}
              </button>
            ))}
          </div>

          {loadingBookings ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No {filter !== "all" ? filter : ""} bookings found.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide"
                      style={{ borderBottom: "1px solid var(--border)", color: "var(--text-light)" }}>
                      <th className="text-left px-5 py-3 font-semibold">Listing</th>
                      <th className="text-left px-5 py-3 font-semibold">Guest</th>
                      <th className="text-left px-5 py-3 font-semibold">Dates</th>
                      <th className="text-right px-5 py-3 font-semibold">Amount</th>
                      <th className="text-left px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50 transition-colors"
                        style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {b.listingImg && (
                              <img src={b.listingImg} alt={b.listingTitle}
                                className="w-10 h-8 rounded-lg object-cover flex-shrink-0" />
                            )}
                            <span className="font-medium max-w-[160px] truncate"
                              style={{ color: "var(--text)" }}>{b.listingTitle}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3" style={{ color: "var(--text-muted)" }}>{b.guestName || "—"}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs" style={{ color: "var(--text-muted)" }}>
                          {format(new Date(b.checkIn), "MMM d")} → {format(new Date(b.checkOut), "MMM d, yyyy")}
                        </td>
                        <td className="px-5 py-3 text-right font-bold" style={{ color: "var(--text)" }}>
                          {numeral(b.totalPrice).format("$0,0")}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLE[b.status]}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Footer summary */}
              <div className="px-5 py-3 text-xs flex items-center justify-between"
                style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <span>{bookings.length} booking{bookings.length !== 1 ? "s" : ""} shown</span>
                <span className="font-bold text-emerald-600">
                  {numeral(bookings.filter((b) => b.status === "confirmed").reduce((s, b) => s + b.totalPrice, 0)).format("$0,0")} confirmed revenue
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
            style={{ background: "var(--surface)" }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Reject listing</h2>
              <p className="text-sm mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                "{rejectModal.listingTitle}"
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea rows={4} autoFocus
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ff5a5f] resize-none"
                placeholder="e.g. Photos are low quality. Please upload clear, well-lit images."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal((m) => m ? { ...m, reason: e.target.value } : m)}
              />
              {!rejectModal.reason.trim() && (
                <p className="text-xs text-red-500 mt-1">A reason is required before rejecting.</p>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setRejectModal(null)} disabled={rejecting}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                style={{ border: "1px solid var(--border-2)", color: "var(--text)" }}>
                Cancel
              </button>
              <button onClick={handleReject} disabled={rejecting || !rejectModal.reason.trim()}
                className="flex-1 py-2.5 bg-[#ff5a5f] text-white rounded-lg text-sm font-semibold hover:bg-[#e0474c] disabled:opacity-50">
                {rejecting ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
