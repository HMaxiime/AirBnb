import numeral from "numeral";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AdminLayout } from "../components/AdminLayout";
import { useAdminStats } from "../hooks/useAdminStats";
import { useAllBookings } from "../hooks/useAllBookings";
import { listingService, userService } from "../../../lib/apiService";
import type { Booking } from "../../../lib/api";
import type { MockUser } from "../../../lib/api";

// ── helpers ───────────────────────────────────────────────────────────────────

function last12Months() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "short", year: "2-digit" }),
      revenue: 0,
      bookings: 0,
    };
  });
}

function monthlyStats(bookings: Booking[]) {
  const months = last12Months();
  for (const b of bookings) {
    const key  = (b.createdAt ?? "").slice(0, 7);
    const slot = months.find((m) => m.key === key);
    if (!slot) continue;
    slot.bookings++;
    if (b.status === "confirmed") slot.revenue += b.totalPrice;
  }
  return months;
}

function statusBreakdown(bookings: Booking[]) {
  const c = { confirmed: 0, pending: 0, cancelled: 0 };
  for (const b of bookings) c[b.status]++;
  const total = bookings.length || 1;
  return [
    { label: "Confirmed", count: c.confirmed, pct: Math.round((c.confirmed / total) * 100), color: "#22c55e" },
    { label: "Cancelled", count: c.cancelled, pct: Math.round((c.cancelled / total) * 100), color: "#9ca3af" },
    { label: "Pending",   count: c.pending,   pct: Math.round((c.pending   / total) * 100), color: "#eab308" },
  ];
}

function userActivity(users: MockUser[], bookings: Booking[]) {
  return users
    .map((u) => {
      const mine = bookings.filter((b) => b.guestId === u.id);
      return {
        ...u,
        bookingCount:  mine.length,
        totalSpent:    mine.filter((b) => b.status === "confirmed").reduce((s, b) => s + b.totalPrice, 0),
        lastActivity:  mine.sort((a, b) => b.createdAt > a.createdAt ? 1 : -1)[0]?.createdAt ?? null,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

// ── component ────────────────────────────────────────────────────────────────

export function AnalyticsPage(): React.JSX.Element {
  const { data: stats }      = useAdminStats();
  const { data: bookings = [] } = useAllBookings();
  const { data: users = [] }    = useQuery<MockUser[]>({ queryKey: ["users"], queryFn: userService.getAll });
  const { data: history = [] }  = useQuery({
    queryKey: ["moderation-history"],
    queryFn:  listingService.getModerationHistory,
  });

  const monthly     = monthlyStats(bookings);
  const maxRevenue  = Math.max(...monthly.map((m) => m.revenue), 1);
  const maxBookings = Math.max(...monthly.map((m) => m.bookings), 1);
  const breakdown   = statusBreakdown(bookings);
  const activity    = userActivity(users, bookings);

  const last12mod = history.slice(-12);
  const maxMod    = Math.max(...last12mod.flatMap((m) => [m.approved, m.rejected]), 1);
  const totalApproved = history.reduce((s, m) => s + m.approved, 0);
  const totalRejected = history.reduce((s, m) => s + m.rejected, 0);

  const totalRevenue  = bookings.filter((b) => b.status === "confirmed").reduce((s, b) => s + b.totalPrice, 0);
  const confirmedRate = bookings.length ? Math.round((bookings.filter((b) => b.status === "confirmed").length / bookings.length) * 100) : 0;

  const kpi = [
    { label: "Total Revenue",    value: numeral(totalRevenue).format("$0,0"),      sub: "Confirmed bookings",     color: "text-emerald-600" },
    { label: "Total Bookings",   value: String(stats?.totalBookings ?? 0),          sub: `${confirmedRate}% confirmed`, color: "text-sky-600" },
    { label: "Active Listings",  value: String(stats?.totalListings ?? 0),          sub: "Published",              color: "text-[#ff5a5f]"   },
    { label: "Registered Users", value: String(stats?.totalUsers    ?? 0),          sub: `${users.filter((u) => u.role === "host").length} hosts`, color: "text-amber-500" },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

        {/* KPI row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpi.map((k) => (
            <div key={k.label} className="bg-white border border-[#ebebeb] rounded-2xl p-5">
              <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{k.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Monthly Revenue</h2>
              <p className="text-xs text-gray-400 mt-0.5">Confirmed bookings only · last 12 months</p>
            </div>
            <p className="text-xl font-bold text-emerald-600">{numeral(totalRevenue).format("$0,0")}</p>
          </div>
          <div className="flex items-end gap-2 h-44">
            {monthly.map((m) => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5 group">
                <span className="text-[10px] font-semibold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {m.revenue > 0 ? numeral(m.revenue).format("$0,0") : "—"}
                </span>
                <div
                  className="w-full bg-[#ff5a5f] rounded-t transition-all"
                  style={{ height: `${Math.max((m.revenue / maxRevenue) * 100, m.revenue > 0 ? 3 : 0)}%` }}
                />
                <span className="text-[10px] text-gray-400 font-medium">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Bookings & Status */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Monthly bookings volume */}
          <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
            <h2 className="text-base font-bold text-gray-900 mb-1">Booking Volume</h2>
            <p className="text-xs text-gray-400 mb-5">All bookings per month · last 12 months</p>
            <div className="flex items-end gap-2 h-36">
              {monthly.map((m) => (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[10px] font-semibold text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.bookings || "—"}
                  </span>
                  <div
                    className="w-full bg-sky-400 rounded-t"
                    style={{ height: `${Math.max((m.bookings / maxBookings) * 100, m.bookings > 0 ? 3 : 0)}%` }}
                  />
                  <span className="text-[10px] text-gray-400">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Booking status breakdown */}
          <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
            <h2 className="text-base font-bold text-gray-900 mb-5">Booking Status Breakdown</h2>
            <div className="space-y-4">
              {breakdown.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">{s.label}</span>
                    <span className="font-bold text-gray-900">{s.count} <span className="font-normal text-gray-400">({s.pct}%)</span></span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-5 mt-5 pt-4 border-t border-[#ebebeb]">
              {breakdown.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Listing moderation history */}
        <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Listing Moderation History</h2>
              <p className="text-xs text-gray-400 mt-0.5">Approved vs rejected per month</p>
            </div>
            <div className="flex gap-5 text-right flex-shrink-0">
              <div>
                <p className="text-xl font-bold text-green-600">{totalApproved}</p>
                <p className="text-xs text-gray-400">Approved</p>
              </div>
              <div>
                <p className="text-xl font-bold text-[#ff5a5f]">{totalRejected}</p>
                <p className="text-xs text-gray-400">Rejected</p>
              </div>
            </div>
          </div>
          {last12mod.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No reviewed listings yet.</p>
          ) : (
            <>
              <div className="flex items-end gap-2 h-44">
                {last12mod.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: 160 }}>
                      <div className="flex-1 bg-green-400 rounded-t" style={{ height: `${(m.approved / maxMod) * 100}%`, minHeight: m.approved > 0 ? 4 : 0 }} title={`Approved: ${m.approved}`} />
                      <div className="flex-1 bg-[#ff5a5f] rounded-t" style={{ height: `${(m.rejected / maxMod) * 100}%`, minHeight: m.rejected > 0 ? 4 : 0 }} title={`Rejected: ${m.rejected}`} />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{m.month.slice(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-5 mt-4 pt-4 border-t border-[#ebebeb]">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-400" /><span className="text-xs text-gray-500">Approved</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#ff5a5f]" /><span className="text-xs text-gray-500">Rejected</span></div>
              </div>
            </>
          )}
        </div>

        {/* User Activity Report */}
        <div className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#ebebeb]">
            <h2 className="text-base font-bold text-gray-900">User Activity Report</h2>
            <p className="text-xs text-gray-400 mt-0.5">All registered users · bookings, spend, and last activity</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-[#ebebeb] text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-semibold">User</th>
                  <th className="text-left px-5 py-3 font-semibold">Role</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="text-right px-5 py-3 font-semibold">Bookings</th>
                  <th className="text-right px-5 py-3 font-semibold">Total Spent</th>
                  <th className="text-left px-5 py-3 font-semibold">Last Activity</th>
                  <th className="text-left px-5 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((u) => (
                  <tr key={u.id} className="border-b border-[#f5f5f5] last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        u.role === "host"  ? "bg-amber-100 text-amber-700" :
                        u.role === "admin" ? "bg-[#fff0f0] text-[#ff5a5f]" :
                        "bg-sky-100 text-sky-700"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {u.banned
                        ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Banned</span>
                        : <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">Active</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{u.bookingCount}</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600">
                      {u.totalSpent > 0 ? numeral(u.totalSpent).format("$0,0") : "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {u.lastActivity ? format(new Date(u.lastActivity), "MMM d, yyyy") : "No activity"}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
