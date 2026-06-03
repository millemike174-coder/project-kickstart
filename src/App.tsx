import Header from './sections/Header';
import Hero from './sections/Hero';
import Studios from './sections/Studios';
import LoSpazio from './sections/LoSpazio';
import Experience from './sections/Experience';
import Team from './sections/Team';
import Contact from './sections/Contact';
import Footer from './sections/Footer';

export default function App() {
  return (
    <div className="bg-[#0A0908] text-[#F5F1E8] min-h-screen w-full overflow-x-clip">
      <Header />
      <Hero />
      <Studios />
      <LoSpazio />
      <Experience />
      <Team />
      <Contact />
      <Footer />
    </div>
  );
}
