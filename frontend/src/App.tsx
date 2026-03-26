import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import AdminDashboard from "./pages/AdminDashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ReportIssue from "./pages/ReportIssue";
import Register from "./pages/Register";
import TrackIssue from "./pages/TrackIssue";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

import { useAuth } from "./context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

export default function App() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

  // If admin, force all routes except /admin and /track to redirect to /admin
  if (isAdmin && location.pathname !== "/admin" && location.pathname !== "/track") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          {isAdmin ? (
            <>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/track" element={<TrackIssue />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/report" element={user ? <ReportIssue /> : <Navigate to="/login" replace />} />
              <Route path="/track" element={<TrackIssue />} />
              <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
              <Route path="/profile" element={<Profile />} />
            </>
          )}
        </Routes>
      </main>
      <Footer />
      <Toast />
    </div>
  );
}
