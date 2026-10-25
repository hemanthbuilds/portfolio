import type { Metadata } from "next";
import { ProjectGroups } from "@/components/projects/ProjectCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { projectsPage } from "@/data/pages";
import { otherProjects } from "@/data/projects";

export const metadata: Metadata = { title: projectsPage.title, description: projectsPage.intro };

export default function ProjectsPage() {
  return (
    <section className="page-container py-24 md:py-32">
      <PageHeader title={projectsPage.title} />
      <div className="mt-14">
        <ProjectGroups others={otherProjects} />
      </div>
    </section>
  );
}
