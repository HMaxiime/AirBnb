import numeral from "numeral";
import { format } from "date-fns";
import { useHostBookings } from "../hooks/useHostBookings";
import { Spinner } from "../../../shared/components/Spinner";
import { DashboardLayout } from "../../../shared/components/DashboardLayout";

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-400",
  pending:   "bg-yellow-100 text-yellow-700",
};

export function HostBookingsPage() {
  const { data: bookings = [], isLoading } = useHostBookings();

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">{bookings.length} total booking{bookings.length !== 1 ? "s" : ""}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : bookings.length === 0 ? (
          <div className="bg-white border border-[#ebebeb] rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-sm">No bookings yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
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
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="font-bold text-gray-900 text-sm">{numeral(b.totalPrice).format("$0,0")}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[b.status] ?? ""}`}>
                          {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                        </span>
                      </div>
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
