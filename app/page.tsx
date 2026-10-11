import { Contact, Experience, Footer, Process } from "@/components/Closing";
import { Features } from "@/components/Features";
import { FoodSection } from "@/components/FoodSection";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { Payments } from "@/components/Payments";
import { PosShowcase } from "@/components/PosShowcase";
import { PosSection } from "@/components/PosSection";
import { Segments } from "@/components/Segments";
import { ServicesAbout } from "@/components/ServicesAbout";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero />
        <PosShowcase />
        <div className="grid sm:gap-3 sm:p-3">
          <PosSection />
          <Payments />
          <Segments />
          <Features />
          <FoodSection />
          <ServicesAbout />
        </div>
        <Experience />
        <Process />
        <div className="sm:px-3 sm:pb-3">
          <Contact />
        </div>
      </main>
      <Footer />
    </>
  );
}
