import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { ProjectArt } from "./ProjectArt";
import { projectsPage } from "@/data/pages";
import { aiProducts, biMarketing, type Project } from "@/data/projects";

export function ProjectCard({ project }: { project: Project }) {
  const links = [
    { label: "Live demo", href: project.liveUrl },
    { label: "GitHub repo", href: project.githubUrl },
    { label: "Presentation", href: project.presentationUrl },
    { label: "Case study", href: project.caseStudy },
  ].filter((link): link is { label: string; href: string } =>
    Boolean(link.href),
  );

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-muted-foreground/40">
      {/* The project's illustrated panel, on a faint blue glow. */}
      <div className="relative aspect-[5/2] shrink-0 overflow-hidden border-b border-border bg-[radial-gradient(ellipse_at_50%_120%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_70%)]">
        <ProjectArt slug={project.slug} />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-[1.1875rem] font-medium">{project.name}</h3>
        <p className="mt-3 leading-relaxed text-card-foreground/80">
          {project.summary}
        </p>
        {/* Pushed to the bottom with room for two rows, so every card's labels start on the same
            line whatever the length of the summary above. */}
        <ul className="mt-auto flex min-h-[5.25rem] flex-wrap content-start gap-2 pt-5">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-5 pt-6 text-[0.9375rem] font-medium">
          {links.length > 0 ? (
            links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                // Live demos and code open in a new tab; the case study stays on this site.
                {...(link.href.startsWith("http") || link.href.endsWith(".pdf")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="inline-flex items-center gap-1.5 hover:text-foreground/80"
              >
                {link.label}
                <ArrowIcon />
              </a>
            ))
          ) : (
            !project.hideComingSoon && (
              <span className="text-muted-foreground">
                {projectsPage.noLinks}
              </span>
            )
          )}
        </div>
      </div>
    </article>
  );
}

export function ProjectGrid({
  projects,
  columns = 2,
}: {
  projects: Project[];
  columns?: 2 | 3;
}) {
  return (
    <ul
      className={`grid gap-4 md:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""}`}
    >
      {projects.map((project) => (
        <li key={project.slug}>
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  );
}

// The Projects section/page: the regular projects first, then the subsections.
const SUBSECTIONS = [
  { id: "bi-marketing", copy: projectsPage.biMarketing, projects: biMarketing },
  { id: "ai-products", copy: projectsPage.aiProducts, projects: aiProducts },
];

export function ProjectGroups({ others }: { others: Project[] }) {
  return (
    <div className="space-y-16">
      {others.length > 0 && <ProjectGrid projects={others} />}
      {SUBSECTIONS.map((section) => (
        <div key={section.id} id={section.id} className="scroll-mt-24">
          <SubHeading title={section.copy.title} intro={section.copy.intro} />
          <div className="mt-6">
            <ProjectGrid projects={section.projects} columns={section.projects.length >= 3 ? 3 : 2} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SubHeading({ title, intro }: { title: string; intro?: string }) {
  return (
    <div>
      <h3 className="text-[1.375rem] font-medium tracking-[-0.01em]">
        {title}
      </h3>
      {intro && (
        <p className="mt-1.5 text-[0.9375rem] text-muted-foreground">{intro}</p>
      )}
    </div>
  );
}
