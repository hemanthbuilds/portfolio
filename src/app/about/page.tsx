import type { Metadata } from "next";
import { AboutIntro, SkillGrid } from "@/components/about/AboutParts";
import { PageHeader } from "@/components/ui/PageHeader";
import { about } from "@/data/about";
import { aboutPage } from "@/data/pages";

export const metadata: Metadata = { title: aboutPage.title, description: about.intro[0] };

export default function AboutPage() {
  return (
    <section className="page-container py-24 md:py-32">
      <PageHeader title={aboutPage.title} />
      <div className="mt-14">
        <AboutIntro />
      </div>
      <h2 className="mt-24 text-3xl font-medium tracking-[-0.01em]">{aboutPage.skillsHeading}</h2>
      <div className="mt-8">
        <SkillGrid />
      </div>
    </section>
  );
}
