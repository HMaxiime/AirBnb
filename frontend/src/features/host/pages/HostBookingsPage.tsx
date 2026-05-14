import numeral from "numeral";
import { format } from "date-fns";
import { useHostBookings, useUpdateBookingStatus } from "../hooks/useHostBookings";
import { Spinner } from "../../../shared/components/Spinner";
import { DashboardLayout } from "../../../shared/components/DashboardLayout";

export function HostBookingsPage() {
  const { data: bookings = [], isLoading } = useHostBookings();
  const { mutate: updateStatus } = useUpdateBookingStatus();
  const pending = bookings.filter((b) => b.status === "pending");

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pending.length} awaiting your response</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : pending.length === 0 ? (
          <div className="bg-white border border-[#ebebeb] rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-sm">No pending requests.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((b) => (
              <div key={b.id} className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden shadow-sm">
                <div className="flex flex-col sm:flex-row">
                  <img src={b.listingImg} alt={b.listingTitle} className="w-full h-36 sm:w-36 sm:h-28 object-cover flex-shrink-0" />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-semibold text-gray-900 text-sm">{b.listingTitle}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Guest: <span className="font-medium text-gray-700">{b.guestName}</span> · {b.guestEmail}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(b.checkIn), "MMM d")} → {format(new Date(b.checkOut), "MMM d, yyyy")} · {b.guests} guest{b.guests > 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className="font-bold text-gray-900 text-sm flex-shrink-0">{numeral(b.totalPrice).format("$0,0")}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => updateStatus({ id: b.id, status: "confirmed" })}
                        className="text-xs bg-green-500 text-white px-4 py-1.5 rounded-lg hover:bg-green-600 font-semibold"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => updateStatus({ id: b.id, status: "cancelled" })}
                        className="text-xs border border-red-200 text-red-500 px-4 py-1.5 rounded-lg hover:bg-red-50 font-semibold"
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
