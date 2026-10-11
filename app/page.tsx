import { Contact, Experience, Footer } from "@/components/Closing";
import { Faq } from "@/components/Faq";
import { Features } from "@/components/Features";
import { FoodSection } from "@/components/FoodSection";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { Payments } from "@/components/Payments";
import { PosShowcase } from "@/components/PosShowcase";
import { Process } from "@/components/Process";
import { PosSection } from "@/components/PosSection";
import { Analytics } from "@/components/Analytics";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { ScrollArrows } from "@/components/ScrollArrows";
import { ScrollHint } from "@/components/ScrollHint";
import { ServicesAbout } from "@/components/ServicesAbout";
import { StructuredData } from "@/components/StructuredData";

export default function Home() {
  return (
    <>
      <StructuredData />
      <Nav />
      <ScrollHint />
      <main id="top">
        <Hero />
        <PosShowcase />
        <div className="grid sm:gap-3 sm:p-3">
          <PosSection />
          <Payments />
          <Features />
          <FoodSection />
          <ServicesAbout />
        </div>
        <Experience />
        <Process />
        <Faq />
        <div className="sm:px-3 sm:pb-3">
          <Contact />
        </div>
      </main>
      <Footer />
      <ScrollArrows />
      <ChatWidget />
      <Analytics />
    </>
  );
}
