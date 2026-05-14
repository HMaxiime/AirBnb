export interface Notification {
  id: string;
  message: string;
  type: "success" | "info" | "warning";
  read: boolean;
  createdAt: string;
}

export interface State {
  filter: string;
  saved: string[];
  notifications: Notification[];
}

export type Action =
  | { type: "SET_FILTER"; payload: string }
  | { type: "TOGGLE_FAVORITE"; payload: string }
  | { type: "RESET" }
  | { type: "ADD_NOTIFICATION"; payload: { message: string; type: Notification["type"] } }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "CLEAR_NOTIFICATIONS" };
