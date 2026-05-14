import { format } from "date-fns";
import { useStore } from "../../../store/StoreContext";
import { DashboardLayout } from "../../../shared/components/DashboardLayout";

export function HostNotificationsPage() {
  const { state, dispatch } = useStore();
  const notifications = state.notifications;
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 space-y-6">

        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-0.5">{unread} unread</p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={() => dispatch({ type: "CLEAR_NOTIFICATIONS" })}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white border border-[#ebebeb] rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`bg-white border rounded-xl p-4 flex items-start gap-3 transition-colors ${
                  n.read ? "border-[#ebebeb]" : "border-[#ff5a5f]/30 bg-[#fff8f8]"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? "text-gray-600" : "text-gray-900 font-medium"}`}>{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(n.createdAt), "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => dispatch({ type: "MARK_NOTIFICATION_READ", payload: n.id })}
                    className="text-xs text-[#ff5a5f] hover:underline flex-shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
