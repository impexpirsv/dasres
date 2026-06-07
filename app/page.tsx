import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Experts from "./components/Experts";
import Companies from "./components/Companies";
import Opportunities from "./components/Opportunities";
import Footer from "./components/Footer";
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