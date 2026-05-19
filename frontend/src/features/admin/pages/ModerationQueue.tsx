import { useState } from "react";
import numeral from "numeral";
import { usePendingListings } from "../hooks/usePendingListings";
import { useApprove } from "../hooks/useApprove";
import { useReject } from "../hooks/useReject";
import { Spinner } from "../../../shared/components/Spinner";
import { AdminLayout } from "../components/AdminLayout";

interface RejectModal {
  listingId: string;
  listingTitle: string;
  reason: string;
}

export function ModerationQueue() {
  const { data: listings = [], isLoading } = usePendingListings();
  const { mutate: approve, isPending: approving } = useApprove();
  const { mutate: reject,  isPending: rejecting  } = useReject();

  const [rejectModal, setRejectModal] = useState<RejectModal | null>(null);

  const closeModal = () => setRejectModal(null);

  const handleReject = () => {
    if (!rejectModal || !rejectModal.reason.trim()) return;
    reject(
      { id: rejectModal.listingId, reason: rejectModal.reason.trim() },
      { onSettled: closeModal },
    );
  };

  const isBusy = approving || rejecting;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Moderation Queue</h1>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {listings.length} pending
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : listings.length === 0 ? (
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
                        <button
                          onClick={() => approve(l.id)}
                          disabled={isBusy}
                          className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-50 font-semibold"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ listingId: l.id, listingTitle: l.title, reason: "" })}
                          disabled={isBusy}
                          className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 font-semibold"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Reject reason modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Reject listing</h2>
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">"{rejectModal.listingTitle}"</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ff5a5f] resize-none"
                placeholder="e.g. Photos are low quality. Please upload clear, well-lit images of the property."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal((m) => m ? { ...m, reason: e.target.value } : m)}
              />
              {!rejectModal.reason.trim() && (
                <p className="text-xs text-red-500 mt-1">A reason is required before rejecting.</p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={closeModal}
                disabled={rejecting}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting || !rejectModal.reason.trim()}
                className="flex-1 py-2.5 bg-[#ff5a5f] text-white rounded-lg text-sm font-semibold hover:bg-[#e0474c] disabled:opacity-50"
              >
                {rejecting ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
