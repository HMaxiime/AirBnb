import numeral from "numeral";
import { usePendingListings } from "../hooks/usePendingListings";
import { useApprove } from "../hooks/useApprove";
import { useReject } from "../hooks/useReject";
import { Spinner } from "../../../shared/components/Spinner";
import { AdminLayout } from "../components/AdminLayout";

export function ModerationQueue() {
  const { data: listings = [], isLoading } = usePendingListings();
  const { mutate: approve, isPending: approving } = useApprove();
  const { mutate: reject, isPending: rejecting } = useReject();

  return (
    <AdminLayout>
    <div className="p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Moderation Queue</h1>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full">{listings.length} pending</span>
        </div>

        {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> :
          listings.length === 0 ? (
            <div className="bg-white border border-[#ebebeb] rounded-2xl p-12 text-center">
              <p className="text-gray-500">Queue is empty — all listings reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((l) => (
                <div key={l.id} className="bg-white border border-[#ebebeb] rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-0">
                    <img src={l.img} alt={l.title} className="w-full h-36 sm:w-36 sm:h-28 object-cover flex-shrink-0" />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="font-semibold text-gray-900 text-sm">{l.title}</h2>
                          <p className="text-xs text-gray-500 mt-0.5">{l.location} · {numeral(l.price).format("$0")}/night</p>
                          <p className="text-xs text-gray-400 mt-0.5">Host: {l.hostName}</p>
                        </div>
                      </div>
                      {l.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{l.description}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => approve(l.id)} disabled={approving}
                          className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-50 font-semibold">
                          ✓ Approve
                        </button>
                        <button onClick={() => reject(l.id)} disabled={rejecting}
                          className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 font-semibold">
                          ✕ Reject
                        </button>
                      </div>
                    </div>
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
