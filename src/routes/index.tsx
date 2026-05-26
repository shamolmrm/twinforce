import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
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
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
