import { produce, Draft } from "immer";
import { State, Action } from "./types";

export function reducer(state: State, action: Action): State {
  return produce(state, (draft: Draft<State>) => {
    switch (action.type) {
      case "SET_FILTER":
        draft.filter = action.payload;
        break;
      case "TOGGLE_FAVORITE": {
        const idx = draft.saved.indexOf(action.payload);
        if (idx >= 0) draft.saved.splice(idx, 1);
        else draft.saved.push(action.payload);
        break;
      }
      case "RESET":
        draft.filter = "";
        draft.saved = [];
        break;
      case "ADD_NOTIFICATION":
        draft.notifications.unshift({
          id: crypto.randomUUID(),
          message: action.payload.message,
          type: action.payload.type,
          read: false,
          createdAt: new Date().toISOString(),
        });
        break;
      case "MARK_NOTIFICATION_READ":
        for (const n of draft.notifications) {
          if (n.id === action.payload) { n.read = true; break; }
        }
        break;
      case "CLEAR_NOTIFICATIONS":
        draft.notifications = [];
        break;
    }
  });
}
