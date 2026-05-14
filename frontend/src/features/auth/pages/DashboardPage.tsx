import { useAuth } from "../hooks/useAuth";
import { useStore } from "../../../store/StoreContext";
import { useListings } from "../../listings/hooks/useListings";
import { useMyBookings } from "../../bookings/hooks/useMyBookings";
import { withAuth } from "../../../shared/hocs/withAuth";
import { CustomerLayout } from "../components/CustomerLayout";
import { GuestChat } from "../../chat/components/GuestChat";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function DashboardPage(): React.JSX.Element {
  const { user } = useAuth();
  const { state } = useStore();
  const { data: listings = [] } = useListings();
  const { data: bookings = [] } = useMyBookings();

  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <CustomerLayout>
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">

        {/* Page header */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#ff5a5f] text-white text-base font-bold flex items-center justify-center flex-shrink-0">
            {user ? getInitials(user.name) : "?"}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.firstName} <span className="text-gray-500 font-semibold">{user?.lastName}</span>
            </h1>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#ebebeb] rounded-2xl p-5">
            <p className="text-3xl font-bold text-[#ff5a5f]">{bookings.length}</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">My bookings</p>
            <p className="text-xs text-gray-400 mt-0.5">All time</p>
          </div>
          <div className="bg-white border border-[#ebebeb] rounded-2xl p-5">
            <p className="text-3xl font-bold text-emerald-600">{confirmedCount}</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">Confirmed</p>
            <p className="text-xs text-gray-400 mt-0.5">Active reservations</p>
          </div>
          <div className="bg-white border border-[#ebebeb] rounded-2xl p-5 col-span-2 sm:col-span-1">
            <p className="text-3xl font-bold text-sky-600">{state.saved.length}</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">Saved</p>
            <p className="text-xs text-gray-400 mt-0.5">Listings saved</p>
          </div>
        </div>

        {/* Chat with hosts */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">Messages</h2>
          <GuestChat />
        </div>

        {/* Available listings count */}
        <div className="bg-white border border-[#ebebeb] rounded-2xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Platform</p>
          <p className="text-2xl font-bold text-gray-900">{listings.length} <span className="text-base font-normal text-gray-500">available listings</span></p>
        </div>

      </div>
    </CustomerLayout>
  );
}

export default withAuth(DashboardPage);
