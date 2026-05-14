import { useAdminStats } from "../hooks/useAdminStats";
import { useAllBookings } from "../hooks/useAllBookings";
import { useBanUser } from "../hooks/useBanUser";
import { useSetRole } from "../hooks/useSetRole";
import { useQuery } from "@tanstack/react-query";
import { userService } from "../../../lib/apiService";
import type { MockUser } from "../../../lib/api";
import { Spinner } from "../../../shared/components/Spinner";
import { AdminLayout } from "../components/AdminLayout";
import { format } from "date-fns";

const METRICS = [
  {
    key: "totalUsers" as const,
    label: "Total users",
    format: (v: number) => String(v),
    sub: "Registered accounts",
    color: "text-violet-600",
  },
  {
    key: "totalListings" as const,
    label: "Total listings",
    format: (v: number) => String(v),
    sub: "Published properties",
    color: "text-sky-600",
  },
  {
    key: "totalBookings" as const,
    label: "Bookings",
    format: (v: number) => String(v),
    sub: "All time",
    color: "text-emerald-600",
  },
];

export function AdminDashboard(): React.JSX.Element {
  const { data: stats, isLoading: loadingStats } = useAdminStats();
  const { data: users = [], isLoading: loadingUsers } = useQuery<MockUser[]>({
    queryKey: ["users"],
    queryFn:  userService.getAll,
  });
  const { data: bookings = [] } = useAllBookings();
  const { mutate: ban, isPending: banning } = useBanUser();
  const { mutate: setRole, isPending: settingRole } = useSetRole();

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        </div>

        {/* Metric cards */}
        {loadingStats ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {METRICS.map((m) => (
              <div key={m.key} className="bg-white border border-[#ebebeb] rounded-2xl p-5">
                <p className={`text-3xl font-bold ${m.color}`}>
                  {m.format(stats?.[m.key] ?? 0)}
                </p>
                <p className="text-sm font-semibold text-gray-800 mt-1">{m.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent bookings */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">Recent bookings</h2>
          {bookings.length === 0 ? (
            <div className="bg-white border border-[#ebebeb] rounded-2xl p-8 text-center text-sm text-gray-400">
              No bookings yet
            </div>
          ) : (
            <div className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-[#ebebeb] text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-semibold">Listing</th>
                    <th className="text-left px-5 py-3 font-semibold">Guest</th>
                    <th className="text-left px-5 py-3 font-semibold">Dates</th>
                    <th className="text-left px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 6).map((b) => (
                    <tr key={b.id} className="border-b border-[#f5f5f5] last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 max-w-[180px] truncate">{b.listingTitle}</td>
                      <td className="px-5 py-3 text-gray-600">{b.guestName || "—"}</td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                        {format(new Date(b.checkIn), "MMM d")} → {format(new Date(b.checkOut), "MMM d, yyyy")}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          b.status === "confirmed" ? "bg-green-100 text-green-700"
                          : b.status === "cancelled" ? "bg-gray-100 text-gray-500"
                          : "bg-yellow-100 text-yellow-700"
                        }`}>
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
            {!loadingUsers && (
              <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                {users.length} registered
              </span>
            )}
          </div>
          {loadingUsers ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : (
            <div className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#ebebeb] text-xs text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-semibold">Name</th>
                    <th className="text-left px-5 py-3 font-semibold">Email</th>
                    <th className="text-left px-5 py-3 font-semibold">Role</th>
                    <th className="text-left px-5 py-3 font-semibold">Status</th>
                    <th className="text-left px-5 py-3 font-semibold">Privileges</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[#f5f5f5] last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-5 py-3 text-gray-500">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className="capitalize text-gray-600">{u.role.toLowerCase()}</span>
                      </td>
                      <td className="px-5 py-3">
                        {u.banned ? (
                          <span className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-semibold">Banned</span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-600 px-2.5 py-1 rounded-full font-semibold">Active</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {!u.banned && u.role !== "admin" && (
                          u.role === "guest" ? (
                            <button
                              onClick={() => setRole({ userId: u.id, role: "host" })}
                              disabled={settingRole}
                              className="text-xs bg-violet-100 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-lg hover:bg-violet-200 disabled:opacity-50 transition-colors font-semibold"
                            >
                              Grant Host
                            </button>
                          ) : u.role === "host" ? (
                            <button
                              onClick={() => setRole({ userId: u.id, role: "guest" })}
                              disabled={settingRole}
                              className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                              Revoke Host
                            </button>
                          ) : null
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {!u.banned && u.role !== "admin" && (
                          <button
                            onClick={() => { if (confirm(`Ban ${u.name}?`)) ban(u.id); }}
                            disabled={banning}
                            className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            Ban
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
