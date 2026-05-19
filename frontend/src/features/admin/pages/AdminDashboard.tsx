import { useState, useEffect } from "react";
import { format } from "date-fns";
import numeral from "numeral";
import { useQuery } from "@tanstack/react-query";
import { useAdminStats } from "../hooks/useAdminStats";
import { useAllBookings } from "../hooks/useAllBookings";
import { useSetRole } from "../hooks/useSetRole";
import { userService } from "../../../lib/apiService";
import type { MockUser } from "../../../lib/api";
import type { Booking } from "../../../lib/api";
import { Spinner } from "../../../shared/components/Spinner";
import { AdminLayout } from "../components/AdminLayout";

// ── Chart helpers ─────────────────────────────────────────────────────────────

function last6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      key:      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label:    d.toLocaleString("default", { month: "short" }),
      revenue:  0,
      bookings: 0,
      users:    0,
    };
  });
}

function buildChartData(bookings: Booking[], users: MockUser[]) {
  const months = last6Months();
  for (const b of bookings) {
    const key  = (b.createdAt ?? "").slice(0, 7);
    const slot = months.find((m) => m.key === key);
    if (!slot) continue;
    slot.bookings++;
    if (b.status === "confirmed") slot.revenue += b.totalPrice;
  }
  for (const u of users) {
    const key  = (u.createdAt ?? "").slice(0, 7);
    const slot = months.find((m) => m.key === key);
    if (slot) slot.users++;
  }
  return months;
}

// ── Mini sparkline bar ────────────────────────────────────────────────────────

function MiniBar({
  data,
  valueKey,
  color,
  formatVal,
}: {
  data: ReturnType<typeof last6Months>;
  valueKey: "revenue" | "bookings" | "users";
  color: string;
  formatVal: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d) => (
        <div key={d.key} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            {formatVal(d[valueKey])}
          </div>
          <div className="w-full rounded-t transition-all"
            style={{ height: `${Math.max((d[valueKey] / max) * 100, d[valueKey] > 0 ? 8 : 2)}%`, background: d[valueKey] > 0 ? color : "#e5e7eb" }} />
          <span className="text-[9px] text-gray-400 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Live indicator ────────────────────────────────────────────────────────────

function LastUpdated({ ts }: { ts: Date }) {
  const [label, setLabel] = useState("just now");
  useEffect(() => {
    const tick = () => {
      const diff = Math.floor((Date.now() - ts.getTime()) / 1000);
      setLabel(diff < 10 ? "just now" : diff < 60 ? `${diff}s ago` : `${Math.floor(diff / 60)}m ago`);
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [ts]);
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      Updated {label}
    </span>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function AdminDashboard(): React.JSX.Element {
  const POLL = 30_000;

  const { data: stats, isLoading: loadingStats, dataUpdatedAt: statsTs }         = useAdminStats();
  const { data: bookings = [], isLoading: loadingBookings, dataUpdatedAt: bookingsTs } = useAllBookings();
  const { data: users = [], isLoading: loadingUsers } = useQuery<MockUser[]>({
    queryKey:        ["users"],
    queryFn:         userService.getAll,
    refetchInterval: POLL,
  });

  const { mutate: setRole, isPending: settingRole } = useSetRole();

  const chart        = buildChartData(bookings, users);
  const totalRevenue = bookings.filter((b) => b.status === "confirmed").reduce((s, b) => s + b.totalPrice, 0);
  const confirmed    = bookings.filter((b) => b.status === "confirmed").length;
  const cancelled    = bookings.filter((b) => b.status === "cancelled").length;
  const confirmedPct = bookings.length ? Math.round((confirmed / bookings.length) * 100) : 0;
  const lastUpdated  = new Date(Math.max(statsTs ?? 0, bookingsTs ?? 0));

  const kpi = [
    { label: "Total Revenue",    value: numeral(totalRevenue).format("$0,0"),        sub: "Confirmed bookings",     color: "text-emerald-600", vk: "revenue"  as const, tc: "#22c55e", fmt: (v: number) => numeral(v).format("$0,0") },
    { label: "Total Bookings",   value: String(stats?.totalBookings ?? bookings.length), sub: `${confirmedPct}% confirmed`, color: "text-sky-600",     vk: "bookings" as const, tc: "#0ea5e9", fmt: (v: number) => String(v) },
    { label: "Active Listings",  value: String(stats?.totalListings ?? 0),           sub: "Published properties",   color: "text-[#ff5a5f]",  vk: null,                tc: "",        fmt: (v: number) => String(v) },
    { label: "Registered Users", value: String(stats?.totalUsers ?? users.length),   sub: `${users.filter((u) => u.role === "host").length} hosts`, color: "text-amber-500", vk: "users" as const, tc: "#f59e0b", fmt: (v: number) => String(v) },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          {!loadingStats && !loadingBookings && <LastUpdated ts={lastUpdated} />}
        </div>

        {/* KPI cards with sparklines */}
        {loadingStats || loadingBookings ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {kpi.map((k) => (
              <div key={k.label} className="bg-white border border-[#ebebeb] rounded-2xl p-5 space-y-3">
                <div>
                  <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{k.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
                </div>
                {k.vk && <MiniBar data={chart} valueKey={k.vk} color={k.tc} formatVal={k.fmt} />}
              </div>
            ))}
          </div>
        )}

        {/* Revenue & Booking charts */}
        {!loadingBookings && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Monthly Revenue */}
            <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Monthly Revenue</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Confirmed bookings · last 6 months</p>
                </div>
                <p className="text-lg font-bold text-emerald-600">{numeral(totalRevenue).format("$0,0")}</p>
              </div>
              <div className="flex items-end gap-2 h-36">
                {chart.map((m) => {
                  const max = Math.max(...chart.map((c) => c.revenue), 1);
                  return (
                    <div key={m.key} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {m.revenue > 0 ? numeral(m.revenue).format("$0,0") : "—"}
                      </span>
                      <div className="w-full bg-[#ff5a5f] rounded-t" style={{ height: `${Math.max((m.revenue / max) * 100, m.revenue > 0 ? 4 : 0)}%` }} />
                      <span className="text-[10px] text-gray-400">{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Booking Volume */}
            <div className="bg-white border border-[#ebebeb] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Booking Volume</h2>
                  <p className="text-xs text-gray-400 mt-0.5">All bookings · last 6 months</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-sky-600">{bookings.length}</p>
                  <p className="text-xs text-gray-400">total</p>
                </div>
              </div>
              <div className="flex items-end gap-2 h-36">
                {chart.map((m) => {
                  const max = Math.max(...chart.map((c) => c.bookings), 1);
                  return (
                    <div key={m.key} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {m.bookings || "—"}
                      </span>
                      <div className="w-full bg-sky-400 rounded-t" style={{ height: `${Math.max((m.bookings / max) * 100, m.bookings > 0 ? 4 : 0)}%` }} />
                      <span className="text-[10px] text-gray-400">{m.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-4 pt-3 border-t border-[#f5f5f5] text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" />{confirmed} confirmed</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" />{cancelled} cancelled</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-300" />{bookings.length - confirmed - cancelled} pending</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent bookings */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-base font-bold text-gray-900">Recent Bookings</h2>
            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-xs font-bold">{bookings.length} total</span>
          </div>
          {loadingBookings ? <div className="flex justify-center py-6"><Spinner /></div> :
           bookings.length === 0 ? <div className="bg-white border border-[#ebebeb] rounded-2xl p-8 text-center text-sm text-gray-400">No bookings yet</div> : (
            <div className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="border-b border-[#ebebeb] text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-semibold">Listing</th>
                    <th className="text-left px-5 py-3 font-semibold">Guest</th>
                    <th className="text-left px-5 py-3 font-semibold">Dates</th>
                    <th className="text-right px-5 py-3 font-semibold">Amount</th>
                    <th className="text-left px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 8).map((b) => (
                    <tr key={b.id} className="border-b border-[#f5f5f5] last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 max-w-[160px] truncate">{b.listingTitle}</td>
                      <td className="px-5 py-3 text-gray-600">{b.guestName || "—"}</td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">{format(new Date(b.checkIn), "MMM d")} → {format(new Date(b.checkOut), "MMM d, yyyy")}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{numeral(b.totalPrice).format("$0,0")}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${b.status === "confirmed" ? "bg-green-100 text-green-700" : b.status === "cancelled" ? "bg-gray-100 text-gray-500" : "bg-yellow-100 text-yellow-700"}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Users */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-base font-bold text-gray-900">Users</h2>
            {!loadingUsers && <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-[#ff5a5f] text-xs font-bold">{users.length} registered</span>}
          </div>
          {loadingUsers ? <div className="flex justify-center py-6"><Spinner /></div> : (
            <div className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-[#ebebeb] text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-semibold">Name</th>
                    <th className="text-left px-5 py-3 font-semibold">Email</th>
                    <th className="text-left px-5 py-3 font-semibold">Role</th>
                    <th className="text-left px-5 py-3 font-semibold">Status</th>
                    <th className="text-left px-5 py-3 font-semibold">Privileges</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[#f5f5f5] last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-5 py-3 text-gray-500">{u.email}</td>
                      <td className="px-5 py-3 capitalize text-gray-600">{u.role.toLowerCase()}</td>
                      <td className="px-5 py-3">
                        {u.banned
                          ? <span className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-semibold">Banned</span>
                          : <span className="text-xs bg-green-100 text-green-600 px-2.5 py-1 rounded-full font-semibold">Active</span>}
                      </td>
                      <td className="px-5 py-3">
                        {!u.banned && u.role !== "admin" && (
                          u.role === "guest" ? (
                            <button onClick={() => setRole({ userId: u.id, role: "host" })} disabled={settingRole}
                              className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-200 disabled:opacity-50 font-semibold">
                              Grant Host
                            </button>
                          ) : (
                            <button onClick={() => setRole({ userId: u.id, role: "guest" })} disabled={settingRole}
                              className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                              Revoke Host
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
