import numeral from "numeral";
import { format } from "date-fns";
import { useHostBookings } from "../hooks/useHostBookings";
import { Spinner } from "../../../shared/components/Spinner";
import { DashboardLayout } from "../../../shared/components/DashboardLayout";

export function HostReservedPage() {
  const { data: bookings = [], isLoading } = useHostBookings();
  const reserved = bookings.filter((b) => b.status === "confirmed");

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reserved</h1>
          <p className="text-sm text-gray-500 mt-0.5">{reserved.length} confirmed reservation{reserved.length !== 1 ? "s" : ""}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : reserved.length === 0 ? (
          <div className="bg-white border border-[#ebebeb] rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-sm">No confirmed reservations yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reserved.map((b) => (
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
                    <span className="mt-3 inline-block text-xs px-2 py-0.5 rounded-full font-semibold bg-green-100 text-green-800">
                      Reserved
                    </span>
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
