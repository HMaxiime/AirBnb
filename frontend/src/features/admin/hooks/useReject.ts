import toast from "react-hot-toast";

// Listing rejection requires a `status` field in the backend schema — not yet supported.
export function useReject() {
  return {
    mutate: (_id: string) => {
      toast("Listing rejection requires backend status field support.", { icon: "⚠️" });
    },
    isPending: false,
  };
}
