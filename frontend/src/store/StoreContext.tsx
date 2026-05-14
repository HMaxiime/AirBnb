import { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { State, Action } from "./types";
import { reducer } from "./reducer";
import { useLocalStorage } from "../shared/hooks/useLocalStorage";

interface StoreContextType {
  state: State;
  dispatch: (action: Action) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [persistedSaved, setPersistedSaved] = useLocalStorage<string[]>("airbnb-saved", []);

  const [state, dispatch] = useReducer(reducer, { filter: "", saved: persistedSaved, notifications: [] });

  useEffect(() => {
    setPersistedSaved(state.saved);
  }, [state.saved, setPersistedSaved]);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
}
