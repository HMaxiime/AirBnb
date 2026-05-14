import { Link } from "react-router-dom";
import { format, differenceInCalendarDays } from "date-fns";
import numeral from "numeral";
import { useMyBookings } from "../hooks/useMyBookings";
import { useCancelBooking } from "../hooks/useCancelBooking";
import { Spinner } from "../../../shared/components/Spinner";
import { CustomerLayout } from "../../auth/components/CustomerLayout";
import { Booking } from "../../../lib/mockDb";

const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100  text-gray-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending:   "Awaiting approval",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

function BookingCard({ b, cancel, cancelling }: { b: Booking; cancel: (id: string) => void; cancelling: boolean }) {
  const nights = differenceInCalendarDays(new Date(b.checkOut), new Date(b.checkIn));

  return (
    <div className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden shadow-sm">
      {/* Image — full width on mobile, left panel on sm+ */}
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-52 sm:flex-shrink-0">
          <img
            src={b.listingImg}
            alt={b.listingTitle}
            className="w-full h-44 sm:h-full object-cover"
          />
        </div>

        <div className="flex-1 p-5 flex flex-col justify-between gap-4 min-w-0">
          {/* Top: title + status */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="font-bold text-gray-900 text-base leading-snug">{b.listingTitle}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 whitespace-nowrap ${STATUS_STYLE[b.status]}`}>
                {STATUS_LABEL[b.status] ?? b.status}
              </span>
            </div>

            {/* Listing properties grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Check-in</p>
                <p className="text-sm font-semibold text-gray-800">{format(new Date(b.checkIn), "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Check-out</p>
                <p className="text-sm font-semibold text-gray-800">{format(new Date(b.checkOut), "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Duration</p>
                <p className="text-sm font-semibold text-gray-800">{nights} night{nights !== 1 ? "s" : ""}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Guests</p>
                <p className="text-sm font-semibold text-gray-800">{b.guests} guest{b.guests !== 1 ? "s" : ""}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Rate</p>
                <p className="text-sm font-semibold text-gray-800">{numeral(b.pricePerNight).format("$0,0")}<span className="font-normal text-gray-500">/night</span></p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total</p>
                <p className="text-sm font-bold text-gray-900">{numeral(b.totalPrice).format("$0,0")}</p>
              </div>
            </div>
          </div>

          {/* Bottom: actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-[#f5f5f5]">
            <Link
              to={`/listings/${b.listingId}`}
              className="flex-1 text-center text-sm font-semibold bg-[#ff5a5f] text-white px-4 py-2 rounded-lg hover:bg-[#e0474c] transition-colors"
            >
              View listing
            </Link>
            {b.status !== "cancelled" && (
              <button
                onClick={() => cancel(b.id)}
                disabled={cancelling}
                className="text-sm font-semibold text-red-500 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ORDER: Booking["status"][] = ["confirmed", "pending", "cancelled"];

export function MyBookingsPage(): React.JSX.Element {
  const { data: bookings = [], isLoading, isError } = useMyBookings();
  const { mutate: cancel, isPending: cancelling } = useCancelBooking();

  const grouped = ORDER.reduce<Record<string, Booking[]>>((acc, s) => {
    acc[s] = bookings.filter((b) => b.status === s);
    return acc;
  }, {} as Record<string, Booking[]>);

  return (
    <CustomerLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-3xl mx-auto">

        {/* Header — same pattern as dashboard */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          {bookings.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">{bookings.length} booking{bookings.length !== 1 ? "s" : ""} total</p>
          )}
        </div>

        {isLoading && <div className="flex justify-center py-20"><Spinner /></div>}

        {isError && (
          <div className="bg-white border border-[#ebebeb] rounded-2xl p-10 text-center text-red-500 text-sm">
            Failed to load bookings.
          </div>
        )}

        {!isLoading && !isError && bookings.length === 0 && (
          <div className="bg-white border border-[#ebebeb] rounded-2xl p-14 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h2>
            <p className="text-sm text-gray-500 mb-6">Start exploring and book your first stay.</p>
            <Link to="/" className="inline-block bg-[#ff5a5f] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#e0474c] transition-colors">
              Browse listings
            </Link>
          </div>
        )}

        {!isLoading && !isError && bookings.length > 0 && ORDER.map((status) => {
          const group = grouped[status];
          if (group.length === 0) return null;
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  {status === "confirmed" ? "Confirmed" : status === "pending" ? "Pending Approval" : "Cancelled"}
                </h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
                  {group.length}
                </span>
              </div>
              <div className="space-y-4">
                {group.map((b) => (
                  <BookingCard key={b.id} b={b} cancel={cancel} cancelling={cancelling} />
                ))}
              </div>
            </div>
          );
        })}

      </div>
    </CustomerLayout>
  );
}
