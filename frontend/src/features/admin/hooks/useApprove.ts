import toast from "react-hot-toast";

// Listing approval requires a `status` field in the backend schema — not yet supported.
export function useApprove() {
  return {
    mutate: (_id: string) => {
      toast("Listing approval requires backend status field support.", { icon: "⚠️" });
    },
    isPending: false,
  };
}
