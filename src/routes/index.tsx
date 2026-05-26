import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { LogosBar } from "@/components/landing/LogosBar";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { UseCases } from "@/components/landing/UseCases";
import { Comparison } from "@/components/landing/Comparison";
import { StatsBand } from "@/components/landing/StatsBand";
import { Integrations } from "@/components/landing/Integrations";
import { Testimonials } from "@/components/landing/Testimonials";
import { Countries } from "@/components/landing/Countries";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TwinForce — Digital Twin Workforce for Enterprise" },
      {
        name: "description",
        content:
          "Deploy AI digital twins of your best operators. 24/7, governed, and production-ready in days. TwinForce — the Digital Twin Workforce platform.",
      },
      { property: "og:title", content: "TwinForce — Digital Twin Workforce" },
      {
        property: "og:description",
        content:
          "AI digital twins of your operators — governed, observable, and shipped in days.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Animated background layers */}
      <div aria-hidden className="bg-aurora" />
      <div aria-hidden className="bg-grid" />
      <div
        aria-hidden
        className="bg-orb"
        style={{ top: "20%", left: "10%", background: "var(--primary)", animationDelay: "0s" }}
      />
      <div
        aria-hidden
        className="bg-orb"
        style={{ top: "60%", right: "8%", background: "var(--accent)", animationDelay: "4s" }}
      />
      <div
        aria-hidden
        className="bg-orb"
        style={{ top: "85%", left: "40%", background: "var(--secondary)", animationDelay: "8s" }}
      />

      <div className="relative z-10">
      <Navbar />
      <main>
        <Hero />
        <LogosBar />
        <HowItWorks />
        <ProductShowcase />
        <Features />
        <UseCases />
        <StatsBand />
        <Comparison />
        <Integrations />
        <Testimonials />
        <Countries />
        <Pricing />
        <FAQ />
        <CtaBanner />
      </main>
      <Footer />
      </div>
    </div>
  );
}
