import { AboutIntro, SkillGrid } from "@/components/about/AboutParts";
import { ArticleGrid } from "@/components/articles/ArticleCard";
import { ArticlesEmpty } from "@/components/articles/ArticlesEmpty";
import { ContactLinks } from "@/components/contact/ContactLinks";
import { ProjectGroups } from "@/components/projects/ProjectCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { homeSections } from "@/data/pages";
import { featuredOtherProjects } from "@/data/projects";
import { site } from "@/data/site";
import { getMediumArticles } from "@/lib/medium";

// The home page continues below the landing screen: Projects → Articles → About → Contact.
// Each section is a short preview of its full page and uses the same data.
export async function HomeSections() {
  const articles = await getMediumArticles(site.mediumUsername);

  return (
    <div className="page-container space-y-32 py-32">
      <Reveal>
        <section id="projects" className="scroll-mt-20">
          <SectionHeader
            title={homeSections.projects.title}
            link={{ label: homeSections.projects.link, href: "/projects" }}
          />
          <div className="mt-10">
            <ProjectGroups others={featuredOtherProjects} />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="articles" className="scroll-mt-20">
          <SectionHeader
            title={homeSections.articles.title}
            intro={homeSections.articles.intro}
            link={{ label: homeSections.articles.link, href: "/articles" }}
          />
          <div className="mt-10">
            {articles.length > 0 ? (
              <ArticleGrid articles={articles.slice(0, homeSections.articles.count)} />
            ) : (
              <ArticlesEmpty />
            )}
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="about" className="scroll-mt-20">
          <SectionHeader title={homeSections.about.title} link={{ label: homeSections.about.link, href: "/about" }} />
          <div className="mt-10 space-y-10">
            <AboutIntro />
            <SkillGrid />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="contact" className="scroll-mt-20">
          <SectionHeader title={homeSections.contact.title} intro={homeSections.contact.intro} />
          <div className="mt-10">
            <ContactLinks />
          </div>
        </section>
      </Reveal>
    </div>
  );
}
