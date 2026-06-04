import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Toaster theme="dark" position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/studios" element={<StudioAvailability />} />
      </Routes>
    </BrowserRouter>
  );
}
