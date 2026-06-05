import Header from "@/sections/Header";
import Hero from "@/sections/Hero";
import Studios from "@/sections/Studios";
import LoSpazio from "@/sections/LoSpazio";
import Experience from "@/sections/Experience";
import Team from "@/sections/Team";
import Videomaker from "@/sections/Videomaker";
import Contact from "@/sections/Contact";
import Footer from "@/sections/Footer";

export default function Landing() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Studios />
        <LoSpazio />
        <Experience />
        <Team />
        <Videomaker />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
