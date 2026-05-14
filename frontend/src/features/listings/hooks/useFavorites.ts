import { useStore } from "../../../store/StoreContext";
import { useToggleSaved } from "./useToggleSaved";
import toast from "react-hot-toast";

interface UseFavoritesReturn {
  toggle: (id: string, title: string) => void;
  count: number;
  isSaved: (id: string) => boolean;
}

export function useFavorites(): UseFavoritesReturn {
  const { state, dispatch } = useStore();
  const { mutate: toggleSaved } = useToggleSaved();

  const toggle = (id: string, title: string): void => {
    const wasSaved = state.saved.includes(id);
    toggleSaved(id);
    if (!wasSaved) {
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: { message: `You saved "${title}" to your favourites.`, type: "success" },
      });
    } else {
      toast.success(`Removed: ${title}`);
    }
  };

  const count = state.saved.length;
  const isSaved = (id: string): boolean => state.saved.includes(id);

  return { toggle, count, isSaved };
}
