import { Contact, Experience, Footer, Process } from "@/components/Closing";
import { Features } from "@/components/Features";
import { FoodSection } from "@/components/FoodSection";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { Payments } from "@/components/Payments";
import { PosSection } from "@/components/PosSection";
import { Segments } from "@/components/Segments";
import { ServicesAbout } from "@/components/ServicesAbout";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero />
        <div className="grid gap-3 p-3">
          <PosSection />
          <Payments />
          <Segments />
          <Features />
          <FoodSection />
          <ServicesAbout />
        </div>
        <Experience />
        <Process />
        <div className="px-3 pb-3">
          <Contact />
        </div>
      </main>
      <Footer />
    </>
  );
}
