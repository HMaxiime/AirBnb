import { Link } from "react-router-dom";
import numeral from "numeral";
import { useMyListings } from "../hooks/useMyListings";
import { useDeleteListing } from "../hooks/useDeleteListing";
import { Spinner } from "../../../shared/components/Spinner";
import { DashboardLayout } from "../../../shared/components/DashboardLayout";

const STATUS_BADGE: Record<string, string> = {
  published: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  draft: "bg-gray-100 text-gray-600",
  rejected: "bg-red-100 text-red-700",
};

export function HostListingsPage() {
  const { data: listings = [], isLoading } = useMyListings();
  const { mutate: deleteListing, isPending: deleting } = useDeleteListing();

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 space-y-6">

        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
            <p className="text-sm text-gray-500 mt-0.5">{listings.length} propert{listings.length === 1 ? "y" : "ies"}</p>
          </div>
          <Link
            to="/host/create"
            className="bg-[#ff5a5f] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#e0474c] transition-colors flex-shrink-0"
          >
            + New listing
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : listings.length === 0 ? (
          <div className="bg-white border border-[#ebebeb] rounded-2xl p-12 text-center">
            <p className="text-gray-500">No listings yet.</p>
            <Link to="/host/create" className="text-[#ff5a5f] font-semibold text-sm mt-2 inline-block">
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <div key={l.id} className="bg-white border border-[#ebebeb] rounded-xl flex flex-col sm:flex-row gap-0 overflow-hidden shadow-sm">
                <img src={l.img} alt={l.title} className="w-full h-32 sm:w-28 sm:h-auto object-cover flex-shrink-0" />
                <div className="flex-1 p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{l.title}</p>
                    <p className="text-xs text-gray-500">{l.location} · {numeral(l.price).format("$0")}/night</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[l.status]}`}>{l.status}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.available ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                        {l.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link to={`/listings/${l.id}`} className="text-xs border border-[#ff5a5f] text-[#ff5a5f] px-3 py-1.5 rounded-lg hover:bg-[#fff5f5]">
                      View
                    </Link>
                    <Link to={`/host/edit/${l.id}`} className="text-xs border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                      Edit
                    </Link>
                    <button
                      onClick={() => { if (confirm("Delete this listing?")) deleteListing(l.id); }}
                      disabled={deleting}
                      className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
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
