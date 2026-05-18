import { Link } from "react-router-dom";
import numeral from "numeral";
import { useMyListings } from "../hooks/useMyListings";
import { useHostBookings } from "../hooks/useHostBookings";
import { Spinner } from "../../../shared/components/Spinner";
import { DashboardLayout } from "../../../shared/components/DashboardLayout";

export function HostDashboard() {
  const { data: listings = [], isLoading: loadingL } = useMyListings();
  const { data: bookings = [], isLoading: loadingB } = useHostBookings();

  const totalRevenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + b.totalPrice, 0);
  const avgRating = listings.length
    ? (listings.reduce((s, l) => s + l.rating, 0) / listings.length).toFixed(2)
    : "–";
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Your hosting at a glance
            </p>
          </div>
          <Link
            to="/host/create"
            className="bg-[#ff5a5f] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#e0474c] transition-colors flex-shrink-0"
          >
            + New listing
          </Link>
        </div>

        {/* Stats */}
        {loadingL || loadingB ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white border border-[#ebebeb] rounded-2xl p-5">
              <p className="text-3xl font-bold text-[#ff5a5f]">
                {listings.length}
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                Listings
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Published properties
              </p>
            </div>
            <div className="bg-white border border-[#ebebeb] rounded-2xl p-5">
              <p className="text-3xl font-bold text-emerald-600">
                {bookings.length}
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                Bookings
              </p>
              <p className="text-xs text-gray-400 mt-0.5">All time</p>
            </div>
            <div className="bg-white border border-[#ebebeb] rounded-2xl p-5">
              <p className="text-3xl font-bold text-sky-600">
                {numeral(totalRevenue).format("$0,0")}
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                Revenue
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Confirmed bookings</p>
            </div>
            <div className="bg-white border border-[#ebebeb] rounded-2xl p-5 col-span-2 xl:col-span-1">
              <p className="text-3xl font-bold text-amber-500">{avgRating}</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                Avg rating
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Across all listings
              </p>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/host/listings"
            className="bg-white border border-[#ebebeb] rounded-2xl p-5 hover:border-gray-300 transition-colors group"
          >
            <p className="text-sm font-semibold text-gray-900 group-hover:text-[#ff5a5f] transition-colors">
              My Listings
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {listings.length} propert{listings.length === 1 ? "y" : "ies"}
            </p>
          </Link>
          <Link
            to="/host/reserved"
            className="bg-white border border-[#ebebeb] rounded-2xl p-5 hover:border-gray-300 transition-colors group"
          >
            <p className="text-sm font-semibold text-gray-900 group-hover:text-[#ff5a5f] transition-colors">
              Reserved
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {bookings.filter((b) => b.status === "confirmed").length}{" "}
              confirmed
            </p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
