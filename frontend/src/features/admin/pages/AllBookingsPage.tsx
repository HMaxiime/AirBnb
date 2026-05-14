import { useState } from "react";
import { format } from "date-fns";
import numeral from "numeral";
import { useAllBookings } from "../hooks/useAllBookings";
import { Booking } from "../../../lib/api";
import { Spinner } from "../../../shared/components/Spinner";
import { AdminLayout } from "../components/AdminLayout";

const FILTERS: Array<{ label: string; value: Booking["status"] | "all" }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancelled", value: "cancelled" },
];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-500",
};

export function AllBookingsPage() {
  const [filter, setFilter] = useState<Booking["status"] | "all">("all");
  const { data: bookings = [], isLoading, isFetching } = useAllBookings(filter);

  return (
    <AdminLayout>
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
          {isFetching && <span className="text-xs text-[#ff5a5f]">Refreshing…</span>}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors
                ${filter === f.value
                  ? "bg-[#ff5a5f] text-white border-[#ff5a5f]"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"}`}>
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> :
          bookings.length === 0 ? (
            <div className="bg-white border border-[#ebebeb] rounded-2xl p-12 text-center">
              <p className="text-gray-500">No {filter !== "all" ? filter : ""} bookings found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="bg-white border border-[#ebebeb] rounded-xl p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3">
                  <div className="flex gap-3 items-center min-w-0 flex-1">
                    <img src={b.listingImg} alt={b.listingTitle} className="w-12 h-10 sm:w-14 sm:h-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{b.listingTitle}</p>
                      <p className="text-xs text-gray-500">
                        {b.guestName} · {format(new Date(b.checkIn), "MMM d")} → {format(new Date(b.checkOut), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className="font-bold text-gray-900 text-sm">{numeral(b.totalPrice).format("$0,0")}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
    </AdminLayout>
  );
}
