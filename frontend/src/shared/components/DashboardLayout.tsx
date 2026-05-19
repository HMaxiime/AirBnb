import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import type { UserRole } from "../../features/auth/types";

type NavItem = { label: string; href: string; exact?: boolean };

const NAV: Record<UserRole, NavItem[]> = {
  guest: [
    { label: "Overview", href: "/dashboard", exact: true },
    { label: "My Bookings", href: "/bookings" },
    { label: "Browse listings", href: "/", exact: true },
    { label: "Settings", href: "/dashboard/settings" },
  ],
  host: [
    { label: "Overview", href: "/host", exact: true },
    { label: "My Listings", href: "/host/listings" },
    { label: "Bookings", href: "/host/bookings" },
    { label: "Reserved", href: "/host/reserved" },
    { label: "Settings", href: "/host/settings" },
  ],
  admin: [
    { label: "Overview", href: "/admin", exact: true },
    { label: "Analytics", href: "/admin/analytics" },
    { label: "Moderation", href: "/admin/moderation" },
    { label: "All Bookings", href: "/admin/bookings" },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  guest: "Client Area",
  host: "Host",
  admin: "Admin",
};

const ROLE_COLOR: Record<UserRole, string> = {
  guest: "text-sky-600",
  host: "text-[#ff5a5f]",
  admin: "text-[#ff5a5f]",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface Props {
  children: ReactNode;
}

export function DashboardLayout({ children }: Props): React.JSX.Element {
  const { user } = useAuth();
  const role = user?.role ?? "guest";
  const navItems = NAV[role];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? "bg-[#fff0f0] dark:bg-[#2a1a1a] text-[#ff5a5f] font-semibold"
        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#242424] hover:text-gray-900 dark:hover:text-gray-100"
    }`;

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      {/* Mobile top nav */}
      <div className="md:hidden bg-white dark:bg-[#1a1a1a] border-b border-[#ebebeb] dark:border-[#2a2a2a] px-3 py-2 flex items-center gap-1 overflow-x-auto">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-7 h-7 rounded-full object-cover flex-shrink-0 mr-1"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[#ff5a5f] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mr-1">
            {user ? getInitials(user.name) : "?"}
          </div>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? "bg-[#fff0f0] dark:bg-[#2a1a1a] text-[#ff5a5f] font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#242424]"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        {role === "admin" && (
          <NavLink
            to="/"
            end
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#242424] transition-colors whitespace-nowrap flex-shrink-0"
          >
            ← Site
          </NavLink>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 flex-shrink-0 bg-white dark:bg-[#1a1a1a] border-r border-[#ebebeb] dark:border-[#2a2a2a] flex-col sticky top-[80px] h-[calc(100vh-80px)]">
          <div className="px-5 py-5 border-b border-[#ebebeb] dark:border-[#2a2a2a]">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#ff5a5f] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {user ? getInitials(user.name) : "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user ? `${user.firstName} ${user.lastName}` : "Guest"}
                </p>
                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${ROLE_COLOR[role]}`}
                >
                  {ROLE_LABEL[role]}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.exact}
                className={navLinkClass}
              >
                {item.label}
              </NavLink>
            ))}
            {role === "admin" && (
              <div className="pt-3 border-t border-[#ebebeb] dark:border-[#2a2a2a] mt-3">
                <NavLink
                  to="/"
                  end
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#242424] hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  ← Back to site
                </NavLink>
              </div>
            )}
          </nav>

        </aside>

        <main className="flex-1 min-w-0 bg-[#f7f7f7] dark:bg-[#0f0f0f] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
