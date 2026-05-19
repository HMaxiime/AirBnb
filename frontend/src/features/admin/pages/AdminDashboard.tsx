import { useState, useEffect } from "react";
import { format } from "date-fns";
import numeral from "numeral";
import { useQuery } from "@tanstack/react-query";
import { useAdminStats } from "../hooks/useAdminStats";
import { useAllBookings } from "../hooks/useAllBookings";
import { useSetRole } from "../hooks/useSetRole";
import { userService } from "../../../lib/apiService";
import { DualLineChart, GroupedBarChart, Sparkline } from "../components/Charts";
import type { MockUser } from "../../../lib/api";
import type { Booking } from "../../../lib/api";
import { Spinner } from "../../../shared/components/Spinner";
import { AdminLayout } from "../components/AdminLayout";

// ── helpers ──────────────────────────────────────────────────────────────────

function last6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      key:      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label:    d.toLocaleString("default", { month: "short" }),
      revenue:  0, bookings: 0, users: 0,
    };
  });
}

function weekDays() {
  return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((label) => ({
    label, confirmed: 0, cancelled: 0,
  }));
}

function buildData(bookings: Booking[], users: MockUser[]) {
  const months = last6Months();
  const days   = weekDays();
  for (const b of bookings) {
    const slot = months.find((m) => m.key === (b.createdAt ?? "").slice(0, 7));
    if (slot) { slot.bookings++; if (b.status === "confirmed") slot.revenue += b.totalPrice; }
    const dow = new Date(b.createdAt ?? Date.now()).getDay(); // 0=Sun
    const idx = dow === 0 ? 6 : dow - 1;
    if (b.status === "confirmed") days[idx].confirmed++;
    else if (b.status === "cancelled") days[idx].cancelled++;
  }
  for (const u of users) {
    const slot = months.find((m) => m.key === (u.createdAt ?? "").slice(0, 7));
    if (slot) slot.users++;
  }
  return { months, days };
}

// ── Live indicator ─────────────────────────────────────────────────────────────

function LiveBadge({ ts }: { ts: Date }) {
  const [label, setLabel] = useState("just now");
  useEffect(() => {
    const tick = () => {
      const s = Math.floor((Date.now() - ts.getTime()) / 1000);
      setLabel(s < 10 ? "just now" : s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`);
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [ts]);
  return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      Live · {label}
    </span>
  );
}

// ── KPI icon wrappers ─────────────────────────────────────────────────────────

function KpiIcon({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
      {children}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function AdminDashboard(): React.JSX.Element {
  const POLL = 30_000;
  const { data: stats, isLoading: loadingStats, dataUpdatedAt: statsTs }               = useAdminStats();
  const { data: bookings = [], isLoading: loadingBookings, dataUpdatedAt: bookingsTs } = useAllBookings();
  const { data: users = [], isLoading: loadingUsers } = useQuery<MockUser[]>({
    queryKey: ["users"], queryFn: userService.getAll, refetchInterval: POLL,
  });
  const { mutate: setRole, isPending: settingRole } = useSetRole();

  const { months, days } = buildData(bookings, users);

  const totalRevenue  = bookings.filter((b) => b.status === "confirmed").reduce((s, b) => s + b.totalPrice, 0);
  const confirmed     = bookings.filter((b) => b.status === "confirmed").length;
  const cancelled     = bookings.filter((b) => b.status === "cancelled").length;
  const confirmedPct  = bookings.length ? Math.round((confirmed / bookings.length) * 100) : 0;
  const lastUpdated   = new Date(Math.max(statsTs ?? 0, bookingsTs ?? 0));

  const revValues  = months.map((m) => m.revenue);
  const bkgValues  = months.map((m) => m.bookings);
  const labels     = months.map((m) => m.label);
  const weekData   = days.map((d) => ({ label: d.label, a: d.confirmed, b: d.cancelled }));

  const kpi = [
    {
      label: "Total Revenue", value: numeral(totalRevenue).format("$0,0"),
      sub: `${confirmedPct}% confirmed`, color: "#10b981", bg: "rgba(16,185,129,0.12)",
      spark: revValues, trend: "+4.35%", up: true,
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
    {
      label: "Total Bookings", value: String(stats?.totalBookings ?? bookings.length),
      sub: "All time", color: "#3b82f6", bg: "rgba(59,130,246,0.12)",
      spark: bkgValues, trend: "+2.59%", up: true,
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    },
    {
      label: "Active Listings", value: String(stats?.totalListings ?? 0),
      sub: "Published", color: "#ff5a5f", bg: "rgba(255,90,95,0.12)",
      spark: null, trend: "+1.82%", up: true,
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ff5a5f" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    },
    {
      label: "Total Users", value: String(stats?.totalUsers ?? users.length),
      sub: `${users.filter((u) => u.role === "host").length} hosts registered`,
      color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",
      spark: months.map((m) => m.users), trend: "+0.95%", up: false,
      icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Overview</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Real-time admin dashboard</p>
          </div>
          {!loadingStats && !loadingBookings && <LiveBadge ts={lastUpdated} />}
        </div>

        {/* KPI Cards */}
        {loadingStats || loadingBookings ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {kpi.map((k) => (
              <div key={k.label} className="rounded-2xl p-5 space-y-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between gap-3">
                  <KpiIcon bg={k.bg}>{k.icon}</KpiIcon>
                  <div className="text-right min-w-0">
                    <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--text)" }}>{k.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{k.sub}</p>
                  </div>
                </div>
                {k.spark && <Sparkline values={k.spark} color={k.color} />}
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: k.up ? "#10b981" : "#ff5a5f" }}>
                  <span>{k.up ? "↑" : "↓"}</span>
                  <span>{k.trend}</span>
                  <span className="font-normal ml-1" style={{ color: "var(--text-muted)" }}>vs last month</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main chart + weekly breakdown */}
        {!loadingBookings && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

            {/* Dual-line chart — 2/3 width */}
            <div className="xl:col-span-2 rounded-2xl p-6"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-5 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#10b981]" />
                      <span className="text-sm font-semibold" style={{ color: "#10b981" }}>Total Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                      <span className="text-sm font-semibold" style={{ color: "#3b82f6" }}>Total Bookings</span>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Last 6 months</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-emerald-500">{numeral(totalRevenue).format("$0,0")}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{bookings.length} bookings</p>
                </div>
              </div>
              <DualLineChart
                labels={labels}
                seriesA={{ label: "Revenue",  values: revValues, color: "#10b981", gradId: "db-rev" }}
                seriesB={{ label: "Bookings", values: bkgValues, color: "#3b82f6", gradId: "db-bk"  }}
                height={240}
                formatA={(v) => numeral(v).format("$0,0")}
                formatB={String}
              />
            </div>

            {/* Weekly grouped chart — 1/3 width */}
            <div className="rounded-2xl p-6"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>This Week</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Bookings</span>
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Confirmed vs cancelled by day</p>
              <GroupedBarChart
                data={weekData}
                colorA="#10b981" colorB="#ff5a5f"
                labelA="Confirmed" labelB="Cancelled"
                height={240}
              />
              <div className="mt-4 pt-4 grid grid-cols-2 gap-3" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="text-center">
                  <p className="text-xl font-bold text-emerald-500">{confirmed}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Confirmed</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[#ff5a5f]">{cancelled}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Cancelled</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Recent Bookings</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">{bookings.length} total</span>
          </div>
          {loadingBookings ? <div className="flex justify-center py-6"><Spinner /></div>
          : bookings.length === 0 ? <div className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>No bookings yet</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[540px]">
                <thead>
                  <tr className="text-xs uppercase tracking-wide" style={{ borderBottom: "1px solid var(--border)", color: "var(--text-light)" }}>
                    <th className="text-left px-6 py-3 font-semibold">Listing</th>
                    <th className="text-left px-6 py-3 font-semibold">Guest</th>
                    <th className="text-left px-6 py-3 font-semibold">Dates</th>
                    <th className="text-right px-6 py-3 font-semibold">Amount</th>
                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 8).map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-6 py-3 font-medium max-w-[160px] truncate" style={{ color: "var(--text)" }}>{b.listingTitle}</td>
                      <td className="px-6 py-3" style={{ color: "var(--text-muted)" }}>{b.guestName || "—"}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-xs" style={{ color: "var(--text-muted)" }}>
                        {format(new Date(b.checkIn), "MMM d")} → {format(new Date(b.checkOut), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-3 text-right font-bold" style={{ color: "var(--text)" }}>{numeral(b.totalPrice).format("$0,0")}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${b.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : b.status === "cancelled" ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"}`}>
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
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Users</h2>
            {!loadingUsers && <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-[#ff5a5f]">{users.length} registered</span>}
          </div>
          {loadingUsers ? <div className="flex justify-center py-6"><Spinner /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="text-xs uppercase tracking-wide" style={{ borderBottom: "1px solid var(--border)", color: "var(--text-light)" }}>
                    <th className="text-left px-6 py-3 font-semibold">Name</th>
                    <th className="text-left px-6 py-3 font-semibold">Email</th>
                    <th className="text-left px-6 py-3 font-semibold">Role</th>
                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                    <th className="text-left px-6 py-3 font-semibold">Privileges</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-6 py-3 font-medium" style={{ color: "var(--text)" }}>{u.name}</td>
                      <td className="px-6 py-3" style={{ color: "var(--text-muted)" }}>{u.email}</td>
                      <td className="px-6 py-3 capitalize" style={{ color: "var(--text-muted)" }}>{u.role}</td>
                      <td className="px-6 py-3">
                        {u.banned
                          ? <span className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-semibold">Banned</span>
                          : <span className="text-xs bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-full font-semibold">Active</span>}
                      </td>
                      <td className="px-6 py-3">
                        {!u.banned && u.role !== "admin" && (
                          u.role === "guest"
                            ? <button onClick={() => setRole({ userId: u.id, role: "host" })} disabled={settingRole}
                                className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-200 disabled:opacity-50 font-semibold">
                                Grant Host
                              </button>
                            : <button onClick={() => setRole({ userId: u.id, role: "guest" })} disabled={settingRole}
                                className="text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                style={{ border: "1px solid var(--border-2)", color: "var(--text-muted)" }}>
                                Revoke Host
                              </button>
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
