export default function App() {
  return (
    <BrowserRouter>
      <Toaster theme="dark" position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/studios" element={<StudioAvailability />} />

        {/* redirect sicurezza per URL errati */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
