import numeral from "numeral";
import { AdminLayout } from "../components/AdminLayout";
import { useAdminStats } from "../hooks/useAdminStats";
import { useAllBookings } from "../hooks/useAllBookings";
import { Booking } from "../../../lib/api";

function getMonthlyRevenue(bookings: Booking[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "short" }),
      revenue: 0,
    };
  });
  for (const b of bookings) {
    if (b.status === "cancelled") continue;
    const key = b.createdAt.slice(0, 7);
    const slot = months.find((m) => m.key === key);
    if (slot) slot.revenue += b.totalPrice;
  }
  return months;
}

function getStatusBreakdown(bookings: Booking[]) {
  const counts = { confirmed: 0, pending: 0, cancelled: 0 };
  for (const b of bookings) counts[b.status]++;
  const total = bookings.length || 1;
  return [
    { label: "Confirmed", count: counts.confirmed, pct: Math.round((counts.confirmed / total) * 100), color: "#22c55e" },
    { label: "Pending",   count: counts.pending,   pct: Math.round((counts.pending   / total) * 100), color: "#eab308" },
    { label: "Cancelled", count: counts.cancelled, pct: Math.round((counts.cancelled / total) * 100), color: "#9ca3af" },
  ];
}

export function AnalyticsPage(): React.JSX.Element {
  const { data: stats } = useAdminStats();
  const { data: bookings = [] } = useAllBookings();

  const monthly = getMonthlyRevenue(bookings);
  const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1);
  const statusBreakdown = getStatusBreakdown(bookings);

  const kpi = [
    { label: "Total Revenue",  value: numeral(stats?.totalRevenue  ?? 0).format("$0,0"), color: "text-emerald-600" },
    { label: "Total Bookings", value: String(stats?.totalBookings  ?? 0),                color: "text-sky-600" },
    { label: "Total Listings", value: String(stats?.totalListings  ?? 0),                color: "text-violet-600" },
    { label: "Total Users",    value: String(stats?.totalUsers     ?? 0),                color: "text-[#ff5a5f]" },
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
            </div>
          ))}
        </div>

        {/* Monthly revenue bar chart */}
        <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-6">Monthly Revenue</h2>
          <div className="flex items-end gap-3 h-48">
            {monthly.map((m) => {
              const heightPct = (m.revenue / maxRevenue) * 100;
              return (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">
                    {m.revenue > 0 ? numeral(m.revenue).format("$0a") : "—"}
                  </span>
                  <div
                    className="w-full bg-blue-500"
                    style={{ height: `${Math.max(heightPct, m.revenue > 0 ? 2 : 0)}%` }}
                  />
                  <span className="text-xs text-gray-400 font-medium">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Booking status breakdown */}
        <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-5">Booking Status</h2>
          <div className="space-y-4">
            {statusBreakdown.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-700">{s.label}</span>
                  <span className="font-bold text-gray-900">{s.count} ({s.pct}%)</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${s.pct}%`, background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-6 pt-4 border-t border-[#ebebeb]">
            {statusBreakdown.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
