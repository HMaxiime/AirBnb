import numeral from "numeral";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AdminLayout } from "../components/AdminLayout";
import { useAdminStats } from "../hooks/useAdminStats";
import { useAllBookings } from "../hooks/useAllBookings";
import { listingService, userService } from "../../../lib/apiService";
import { MovingAverageChart, PieComparison, StackedHBarChart } from "../components/Charts";
import type { Booking } from "../../../lib/api";
import type { MockUser } from "../../../lib/api";

function last12Months() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      key:       `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label:     d.toLocaleString("default", { month: "short" }),
      revenue:   0,
      bookings:  0,
      confirmed: 0,
    };
  });
}

function monthlyStats(bookings: Booking[]) {
  const months = last12Months();
  for (const b of bookings) {
    const slot = months.find((m) => m.key === (b.createdAt ?? "").slice(0, 7));
    if (!slot) continue;
    slot.bookings++;
    if (b.status === "confirmed") { slot.revenue += b.totalPrice; slot.confirmed++; }
  }
  return months;
}

function userActivity(users: MockUser[], bookings: Booking[]) {
  return users
    .map((u) => {
      const mine = bookings.filter((b) => b.guestId === u.id);
      return {
        ...u,
        bookingCount: mine.length,
        totalSpent:   mine.filter((b) => b.status === "confirmed").reduce((s, b) => s + b.totalPrice, 0),
        lastActivity: mine.sort((a, b) => b.createdAt > a.createdAt ? 1 : -1)[0]?.createdAt ?? null,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent);
}

export function AnalyticsPage(): React.JSX.Element {
  const { data: stats }         = useAdminStats();
  const { data: bookings = [] } = useAllBookings();
  const { data: users = [] }    = useQuery<MockUser[]>({ queryKey: ["users"], queryFn: userService.getAll });
  const { data: history = [] }  = useQuery({ queryKey: ["moderation-history"], queryFn: listingService.getModerationHistory });

  const monthly     = monthlyStats(bookings);
  const activity    = userActivity(users, bookings);

  const totalRevenue  = bookings.filter((b) => b.status === "confirmed").reduce((s, b) => s + b.totalPrice, 0);
  const confirmedRate = bookings.length ? Math.round((bookings.filter((b) => b.status === "confirmed").length / bookings.length) * 100) : 0;

  const totalApproved = history.reduce((s, m) => s + m.approved, 0);
  const totalRejected = history.reduce((s, m) => s + m.rejected, 0);
  const last12mod     = history.slice(-12);

  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;
  const pending   = bookings.length - confirmed - cancelled;

  const revenueData  = monthly.map((m) => ({ label: m.label, value: m.revenue  }));
  const bookingsData = monthly.map((m) => ({ label: m.label, value: m.bookings }));
  const modData      = last12mod.map((m) => ({ label: m.month.slice(2), a: m.approved, b: m.rejected }));

  // Align moderation history with the 12-month window
  const monthlyMod = monthly.map((m) => {
    const match = last12mod.find((h) => h.month === m.key);
    return match ? match.approved + match.rejected : 0;
  });

  // Booking status confirmed % per month
  const monthlyStatusPct = monthly.map((m) =>
    m.bookings > 0 ? Math.round((m.confirmed / m.bookings) * 100) : 0
  );

  // Subtitle: e.g. "January - December 2025"
  const now = new Date();
  const chartSubtitle = `${new Date(now.getFullYear(), now.getMonth() - 11, 1).toLocaleString("default", { month: "long" })} – ${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;

  const donutSlices = [
    { label: "Confirmed", value: confirmed, color: "#22c55e" },
    { label: "Cancelled", value: cancelled, color: "#9ca3af" },
    { label: "Pending",   value: pending,   color: "#eab308" },
  ].filter((s) => s.value > 0);

  const kpi = [
    { label: "Total Revenue",    value: numeral(totalRevenue).format("$0,0"), sub: "Confirmed bookings",     color: "text-emerald-600", border: "border-emerald-100" },
    { label: "Total Bookings",   value: String(stats?.totalBookings ?? 0),    sub: `${confirmedRate}% confirmed`, color: "text-sky-600",  border: "border-sky-100"     },
    { label: "Active Listings",  value: String(stats?.totalListings ?? 0),    sub: "Published",              color: "text-[#ff5a5f]",   border: "border-red-100"     },
    { label: "Registered Users", value: String(stats?.totalUsers ?? 0),       sub: `${users.filter((u) => u.role === "host").length} hosts`, color: "text-violet-600", border: "border-violet-100" },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">Full platform metrics and trends</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpi.map((k) => (
            <div key={k.label} className={`bg-white border ${k.border} rounded-2xl p-5`}>
              <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{k.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* 2×2 Moving Average Charts */}
        <div>
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900">Moving Averages</h2>
            <p className="text-xs text-gray-400 mt-0.5">{chartSubtitle} · each chart shows actual values (faint) + 3-month moving average (bold)</p>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            {/* Revenue */}
            <div className="bg-white border border-[#ebebeb] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-sm font-bold text-gray-900">Revenue Over Time</span>
                </div>
                <span className="text-lg font-bold text-emerald-500">{numeral(totalRevenue).format("$0,0")}</span>
              </div>
              <MovingAverageChart
                labels={monthly.map((m) => m.label)}
                values={monthly.map((m) => m.revenue)}
                color="#86efac"
                maColor="#10b981"
                gradId="ma-rev"
                title=""
                formatVal={(v) => numeral(v).format("$0,0")}
                height={200}
              />
            </div>

            {/* Booking Volume */}
            <div className="bg-white border border-[#ebebeb] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5a5f]" />
                  <span className="text-sm font-bold text-gray-900">Booking Volume</span>
                </div>
                <span className="text-lg font-bold text-[#ff5a5f]">{bookings.length} total</span>
              </div>
              <MovingAverageChart
                labels={monthly.map((m) => m.label)}
                values={monthly.map((m) => m.bookings)}
                color="#fca5a5"
                maColor="#ff5a5f"
                gradId="ma-bk"
                title=""
                formatVal={(v) => `${v} bookings`}
                height={200}
              />
            </div>

            {/* Booking Status */}
            <div className="bg-white border border-[#ebebeb] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                  <span className="text-sm font-bold text-gray-900">Booking Confirmation Rate</span>
                </div>
                <span className="text-lg font-bold text-[#3b82f6]">{confirmedRate}% avg</span>
              </div>
              <MovingAverageChart
                labels={monthly.map((m) => m.label)}
                values={monthlyStatusPct}
                color="#93c5fd"
                maColor="#3b82f6"
                gradId="ma-st"
                title=""
                formatVal={(v) => `${v}%`}
                height={200}
              />
            </div>

            {/* Moderation History */}
            <div className="bg-white border border-[#ebebeb] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-800" />
                  <span className="text-sm font-bold text-gray-900">Moderation Activity</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{totalApproved + totalRejected} reviewed</span>
              </div>
              <MovingAverageChart
                labels={monthly.map((m) => m.label)}
                values={monthlyMod}
                color="#9ca3af"
                maColor="#111827"
                gradId="ma-mod"
                title=""
                formatVal={(v) => `${v} listings`}
                height={200}
              />
            </div>

          </div>
        </div>

        {/* Moderation History */}
        <div>
          <div className="rounded-2xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Listing Moderation History</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {chartSubtitle} · hover a slice for detail
                </p>
              </div>
              <div className="flex gap-4 text-right">
                <div><p className="text-base font-bold text-emerald-600">{totalApproved}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>Approved</p></div>
                {totalRejected > 0 && (
                  <div><p className="text-base font-bold text-[#ff5a5f]">{totalRejected}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>Rejected</p></div>
                )}
              </div>
            </div>
            {totalApproved + totalRejected === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>No reviewed listings yet.</p>
            ) : (
              <>
                {/* Pie chart */}
                <PieComparison
                  leftTitle="Moderation"
                  leftSlices={[
                    { label: "Approved", value: totalApproved, color: "#22c55e" },
                    ...(totalRejected > 0 ? [{ label: "Rejected", value: totalRejected, color: "#ff5a5f" }] : []),
                  ]}
                  rightTitle=""
                  rightSlices={[]}
                  tableRows={[
                    {
                      label: "Total",
                      leftCols: [
                        { label: "Approved", value: totalApproved, total: totalApproved + totalRejected, color: "#22c55e" },
                        ...(totalRejected > 0 ? [{ label: "Rejected", value: totalRejected, total: totalApproved + totalRejected, color: "#ff5a5f" }] : []),
                      ],
                      rightCols: [],
                    },
                  ]}
                />

                {/* Stacked bar breakdown per month — below the pie */}
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-xs font-semibold mb-4" style={{ color: "var(--text-muted)" }}>
                    Monthly breakdown
                  </p>
                  <StackedHBarChart
                    series={[
                      { label: "Approved", color: "#22c55e" },
                      ...(totalRejected > 0 ? [{ label: "Rejected", color: "#ff5a5f" }] : []),
                    ]}
                    rows={monthly
                      .map((m) => {
                        const match    = last12mod.find((h) => h.month === m.key);
                        const approved = match?.approved ?? 0;
                        const rejected = match?.rejected ?? 0;
                        return {
                          label:  m.label,
                          values: totalRejected > 0 ? [approved, rejected] : [approved],
                        };
                      })
                      .filter((r) => r.values.some((v) => v > 0))}
                    barHeight={24}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* User Activity Report */}
        <div className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#ebebeb]">
            <h2 className="text-base font-bold text-gray-900">User Activity Report</h2>
            <p className="text-xs text-gray-400 mt-0.5">All registered users sorted by spend · bookings and last activity</p>
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
                {activity.map((u, idx) => (
                  <tr key={u.id} className="border-b border-[#f5f5f5] last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.role === "host" ? "bg-amber-100 text-amber-700" : u.role === "admin" ? "bg-[#fff0f0] text-[#ff5a5f]" : "bg-sky-100 text-sky-700"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {u.banned
                        ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Banned</span>
                        : <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">Active</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-bold text-gray-900">{u.bookingCount}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {u.totalSpent > 0
                        ? <span className="font-bold text-emerald-600">{numeral(u.totalSpent).format("$0,0")}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {u.lastActivity ? format(new Date(u.lastActivity), "MMM d, yyyy") : <span className="text-gray-300">No activity</span>}
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
