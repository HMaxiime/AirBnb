import toast from "react-hot-toast";

// The backend User model does not have a `banned` field yet.
// This hook is a placeholder that informs the admin until the feature is added.
export function useBanUser() {
  return {
    mutate: (_userId: string) => {
      toast("Ban feature requires backend support for a 'banned' field.", { icon: "⚠️" });
    },
    isPending: false,
  };
}
