import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Experts from "./components/Experts";
import Companies from "./components/Companies";
import Opportunities from "./components/Opportunities";
import Footer from "./components/Footer";
import LiveStats from "./components/LiveStats";
import TopRatedShowcase from "./components/TopRatedShowcase";

export const revalidate = 300;

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Hero />
      <LiveStats />
      <TopRatedShowcase />
      <Services />
      <Experts />
      <Companies />
      <Opportunities />
      <Footer />
    </main>
  );
}