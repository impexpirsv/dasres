import Navbar from "./components/Navbar.tsx";
import Hero from "./components/Hero.tsx";
import Services from "./components/Services.tsx";
import Experts from "./components/Experts.tsx";
import Companies from "./components/Companies.tsx";
import Opportunities from "./components/Opportunities.tsx";
import Footer from "./components/Footer.tsx";
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Hero />
      <Services />
      <Experts />
      <Companies />
      <Opportunities />
      <Footer />
    </main>
  );
}