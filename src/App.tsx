import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Header from './sections/Header';
import Hero from './sections/Hero';
import Studios from './sections/Studios';
import LoSpazio from './sections/LoSpazio';
import Experience from './sections/Experience';
import Team from './sections/Team';
import Videomaker from './sections/Videomaker';
import Contact from './sections/Contact';
import Footer from './sections/Footer';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import StudioAvailability from './pages/StudioAvailability';
import ErrorBoundary from './components/ErrorBoundary';

function Landing() {
  return (
    <div className="bg-[#0A0908] text-[#F5F1E8] min-h-screen w-full overflow-x-clip">
      <Header />
      <Hero />
      <Studios />
      <LoSpazio />
      <Experience />
      <Team />
      <Videomaker />
      <Contact />
      <Footer />
    </div>
  );
}

// Routes: /, /admin/login, /admin/dashboard, /admin/studios
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster theme="dark" position="top-center" richColors />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/login)" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/studios" element={<StudioAvailability />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
