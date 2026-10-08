import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import SenderDashboard from "./pages/SenderDashboard";
import TransporterDashboard from "./pages/TransporterDashboard";
import ReceiverDashboard from "./pages/ReceiverDashboard";
import AuditorDashboard from "./pages/AuditorDashboard";
import Navbar from "./components/Navbar";

/* ---------- Protected Route ---------- */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's own dashboard
    const dashPaths = {
      sender: "/sender",
      transporter: "/transporter",
      receiver: "/receiver",
      auditor: "/audit",
    };
    return <Navigate to={dashPaths[user.role] || "/login"} replace />;
  }
  return children;
}

/* ---------- App Routes ---------- */
function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  const homePath = isAuthenticated
    ? { sender: "/sender", transporter: "/transporter", receiver: "/receiver", auditor: "/audit" }[user.role] || "/login"
    : "/login";

  return (
    <>
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to={homePath} replace /> : <LoginPage />} />

        <Route path="/sender" element={
          <ProtectedRoute allowedRoles={["sender"]}>
            <SenderDashboard />
          </ProtectedRoute>
        } />

        <Route path="/transporter" element={
          <ProtectedRoute allowedRoles={["transporter"]}>
            <TransporterDashboard />
          </ProtectedRoute>
        } />

        <Route path="/custody" element={
          <ProtectedRoute allowedRoles={["sender", "transporter"]}>
            <TransporterDashboard />
          </ProtectedRoute>
        } />

        <Route path="/receiver" element={
          <ProtectedRoute allowedRoles={["receiver"]}>
            <ReceiverDashboard />
          </ProtectedRoute>
        } />

        <Route path="/audit" element={
          <ProtectedRoute allowedRoles={["auditor"]}>
            <AuditorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/audit/:organId" element={
          <ProtectedRoute allowedRoles={["auditor"]}>
            <AuditorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/history" element={
          <ProtectedRoute allowedRoles={["auditor", "sender", "receiver"]}>
            <AuditorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/history/:organId" element={
          <ProtectedRoute allowedRoles={["auditor", "sender", "receiver", "transporter"]}>
            <AuditorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to={homePath} replace />} />
        <Route path="*" element={<Navigate to={homePath} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
