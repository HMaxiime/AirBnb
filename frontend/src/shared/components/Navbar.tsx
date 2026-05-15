import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useStore } from "../../store/StoreContext";
import { useDarkMode } from "../hooks/useDarkMode";
import { format } from "date-fns";
import "./Navbar.css";

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { state, dispatch } = useStore();
  const [bellOpen, setBellOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [dark, toggleDark] = useDarkMode();
  const bellRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const notifications = state.notifications;
  const unread = notifications.filter((n) => !n.read).length;

  const handleSearch = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (pathname !== "/") navigate("/");
  };

  useEffect(() => {
    if (!bellOpen) return;
    const close = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node))
        setBellOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [bellOpen]);

  useEffect(() => {
    if (!avatarOpen) return;
    const close = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node))
        setAvatarOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [avatarOpen]);

  const clearSearch = () => dispatch({ type: "SET_FILTER", payload: "" });

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left: Logo */}
        <NavLink
          to="/"
          className="brand-link"
        >
          <span className="brand-text">
            Air<span className="brand-b">b</span>nb
          </span>
        </NavLink>

        {/* Center: Search pill */}
        <form className="search-pill" onSubmit={handleSearch}>
          <svg
            viewBox="0 0 32 32"
            className="pill-search-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          >
            <circle cx="13" cy="13" r="9" />
            <line x1="20" y1="20" x2="28" y2="28" />
          </svg>
          <input
            type="text"
            className="pill-input"
            placeholder="Anywhere"
            value={state.filter}
            onChange={(e) =>
              dispatch({ type: "SET_FILTER", payload: e.target.value })
            }
          />
          {state.filter && (
            <button
              type="button"
              className="pill-clear"
              onClick={clearSearch}
              aria-label="Clear"
            >
              ✕
            </button>
          )}
          <button type="submit" className="pill-btn" aria-label="Search">
            <svg viewBox="0 0 32 32" width="14" height="14" fill="white">
              <path d="M13 3C7.5 3 3 7.5 3 13s4.5 10 10 10c2.4 0 4.6-.8 6.3-2.2l6.4 6.4 1.4-1.4-6.4-6.4C22.2 17.6 23 15.4 23 13 23 7.5 18.5 3 13 3zm0 2c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8z" />
            </svg>
          </button>
        </form>

        {/* Right: Dark mode + Bell + Account */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            justifyContent: "flex-end",
          }}
        >
          {/* Dark mode */}
          <button
            onClick={toggleDark}
            className="icon-btn"
            aria-label={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? (
              <svg
                viewBox="0 0 24 24"
                className="icon-mode"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="icon-mode"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Notification bell */}
          <div
            className="menu-wrap"
            ref={bellRef}
            style={{ position: "relative" }}
          >
            <button
              className="icon-btn"
              onClick={() => {
                setBellOpen((v) => !v);
                setAvatarOpen(false);
              }}
              aria-label="Notifications"
              style={{ position: "relative" }}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#ff5a5f",
                    border: "1.5px solid white",
                  }}
                />
              )}
            </button>

            {bellOpen && (
              <div
                className="menu-dropdown"
                style={{
                  width: 320,
                  right: 0,
                  left: "auto",
                  maxHeight: 420,
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px 8px",
                    borderBottom: "1px solid var(--border-2)",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    Notifications{" "}
                    {unread > 0 && (
                      <span style={{ color: "#ff5a5f" }}>({unread})</span>
                    )}
                  </span>
                  {notifications.length > 0 && (
                    <div style={{ display: "flex", gap: 8 }}>
                      {unread > 0 && (
                        <button
                          onClick={() =>
                            notifications
                              .filter((n) => !n.read)
                              .forEach((n) =>
                                dispatch({
                                  type: "MARK_NOTIFICATION_READ",
                                  payload: n.id,
                                }),
                              )
                          }
                          style={{
                            fontSize: 11,
                            color: "#ff5a5f",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() =>
                          dispatch({ type: "CLEAR_NOTIFICATIONS" })
                        }
                        style={{
                          fontSize: 11,
                          color: "var(--text-light)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "28px 14px",
                      textAlign: "center",
                      color: "var(--text-light)",
                      fontSize: 13,
                    }}
                  >
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--border-2)",
                        background: n.read
                          ? "transparent"
                          : "rgba(255,90,95,0.04)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: "var(--text)",
                          fontWeight: n.read ? 400 : 600,
                          lineHeight: 1.4,
                        }}
                      >
                        {n.message}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span
                          style={{ fontSize: 11, color: "var(--text-light)" }}
                        >
                          {format(new Date(n.createdAt), "MMM d · h:mm a")}
                        </span>
                        {!n.read && (
                          <button
                            onClick={() =>
                              dispatch({
                                type: "MARK_NOTIFICATION_READ",
                                payload: n.id,
                              })
                            }
                            style={{
                              fontSize: 11,
                              color: "#ff5a5f",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div className="menu-wrap" ref={avatarRef}>
              <button
                onClick={() => { setAvatarOpen((v) => !v); setBellOpen(false); }}
                className={`menu-btn${avatarOpen ? " open" : ""}`}
                aria-label="Account menu"
                aria-expanded={avatarOpen}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff5a5f] text-xs font-bold text-white flex-shrink-0">
                    {(user?.firstName?.[0] ?? user?.name?.[0] ?? "?").toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
                  {user?.firstName ?? user?.name?.split(" ")[0] ?? "Account"}
                </span>
              </button>

              {avatarOpen && (
                <div className="menu-dropdown" style={{ right: 0, left: "auto", minWidth: 180 }}>
                  <NavLink
                    to={
                      user?.role === "host" ? "/host"
                      : user?.role === "admin" ? "/admin"
                      : "/dashboard"
                    }
                    className="menu-item menu-item-bold"
                    onClick={() => setAvatarOpen(false)}
                  >
                    My account
                  </NavLink>
                  <button
                    onClick={() => { setAvatarOpen(false); logout(); }}
                    className="menu-item-btn"
                    style={{ color: "#ef4444" }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <NavLink
              to="/login"
              className="rounded-full bg-[#ff5a5f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e04e53]"
            >
              Log in
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
