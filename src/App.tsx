import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Landing from "@/pages/Landing";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import StudioAvailability from "@/pages/StudioAvailability";
import BookingSuccess from "@/pages/BookingSuccess";
import BookingCancelled from "@/pages/BookingCancelled";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster theme="dark" position="top-center" richColors />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/studios" element={<StudioAvailability />} />
          <Route path="/booking/success" element={<BookingSuccess />} />
          <Route path="/booking/cancelled" element={<BookingCancelled />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
