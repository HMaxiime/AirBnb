import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import NProgress from "nprogress";
import { Navbar } from "./shared/components/Navbar";
import { Footer } from "./shared/components/Footer";
import { NotFound } from "./shared/components/NotFound";
import { ProtectedRoute } from "./shared/components/ProtectedRoute";
import { Spinner } from "./shared/components/Spinner";
import { ListingsPage } from "./features/listings";
import { LoginPage, SignupPage } from "./features/auth";

const ListingDetail = lazy(() =>
  import("./features/listings/pages/ListingDetail").then((m) => ({
    default: m.ListingDetail,
  })),
);
const DashboardPage = lazy(() => import("./features/auth/pages/DashboardPage"));
const BookingPage = lazy(() =>
  import("./features/bookings/pages/BookingPage").then((m) => ({
    default: m.BookingPage,
  })),
);
const MyBookingsPage = lazy(() =>
  import("./features/bookings/pages/MyBookingsPage").then((m) => ({
    default: m.MyBookingsPage,
  })),
);
const HostDashboard = lazy(() =>
  import("./features/host/pages/HostDashboard").then((m) => ({
    default: m.HostDashboard,
  })),
);
const HostListingsPage = lazy(() =>
  import("./features/host/pages/HostListingsPage").then((m) => ({
    default: m.HostListingsPage,
  })),
);
const HostBookingsPage = lazy(() =>
  import("./features/host/pages/HostBookingsPage").then((m) => ({
    default: m.HostBookingsPage,
  })),
);
const HostReservedPage = lazy(() =>
  import("./features/host/pages/HostReservedPage").then((m) => ({
    default: m.HostReservedPage,
  })),
);
const HostNotificationsPage = lazy(() =>
  import("./features/host/pages/HostNotificationsPage").then((m) => ({
    default: m.HostNotificationsPage,
  })),
);
const CreateListingPage = lazy(() =>
  import("./features/host/pages/CreateListingPage").then((m) => ({
    default: m.CreateListingPage,
  })),
);
const EditListingPage = lazy(() =>
  import("./features/host/pages/EditListingPage").then((m) => ({
    default: m.EditListingPage,
  })),
);
const AdminDashboard = lazy(() =>
  import("./features/admin/pages/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const AnalyticsPage = lazy(() =>
  import("./features/admin/pages/AnalyticsPage").then((m) => ({
    default: m.AnalyticsPage,
  })),
);
const ModerationQueue = lazy(() =>
  import("./features/admin/pages/ModerationQueue").then((m) => ({
    default: m.ModerationQueue,
  })),
);
const AllBookingsPage = lazy(() =>
  import("./features/admin/pages/AllBookingsPage").then((m) => ({
    default: m.AllBookingsPage,
  })),
);
const SettingsPage = lazy(() =>
  import("./features/auth/pages/SettingsPage").then((m) => ({
    default: m.SettingsPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("./features/auth/pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("./features/auth/pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);

const NO_FOOTER = [
  "/admin",
  "/host",
  "/dashboard",
  "/bookings",
  "/dashboard/settings",
];

function App() {
  const location = useLocation();
  const showFooter = !NO_FOOTER.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    NProgress.start();
    const t = setTimeout(() => NProgress.done(), 100);
    return () => clearTimeout(t);
  }, [location]);

  return (
    <>
      <Navbar />
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<ListingsPage />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/reset-password/:token"
            element={<ResetPasswordPage />}
          />

          {/* Guest */}
          <Route
            path="/book/:id"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />

          {/* Auth — protected via withAuth HOC */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Host */}
          <Route
            path="/host"
            element={
              <ProtectedRoute roles={["host"]}>
                <HostDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/listings"
            element={
              <ProtectedRoute roles={["host"]}>
                <HostListingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/bookings"
            element={
              <ProtectedRoute roles={["host"]}>
                <HostBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/reserved"
            element={
              <ProtectedRoute roles={["host"]}>
                <HostReservedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/notifications"
            element={
              <ProtectedRoute roles={["host"]}>
                <HostNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/create"
            element={
              <ProtectedRoute roles={["host"]}>
                <CreateListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/edit/:id"
            element={
              <ProtectedRoute roles={["host"]}>
                <EditListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/settings"
            element={
              <ProtectedRoute roles={["host"]}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/moderation"
            element={
              <ProtectedRoute roles={["admin"]}>
                <ModerationQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AllBookingsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {showFooter && <Footer />}
    </>
  );
}

export default App;
