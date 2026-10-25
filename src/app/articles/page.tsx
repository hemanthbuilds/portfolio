import type { Metadata } from "next";
import { ArticleGrid } from "@/components/articles/ArticleCard";
import { ArticlesEmpty } from "@/components/articles/ArticlesEmpty";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { PageHeader } from "@/components/ui/PageHeader";
import { articlesPage } from "@/data/pages";
import { site } from "@/data/site";
import { getMediumArticles } from "@/lib/medium";

export const metadata: Metadata = { title: articlesPage.title, description: articlesPage.intro };

// Articles come from Medium (refreshed every few hours; see src/lib/medium.ts).
export default async function ArticlesPage() {
  const articles = await getMediumArticles(site.mediumUsername);

  return (
    <section className="page-container py-24 md:py-32">
      <PageHeader title={articlesPage.title} intro={articlesPage.intro} />
      <div className="mt-12">
        {articles.length > 0 ? <ArticleGrid articles={articles} /> : <ArticlesEmpty />}
      </div>
      {articles.length > 0 && (
        <a
          href={`https://medium.com/@${site.mediumUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center gap-1.5 text-[0.9375rem] font-medium underline underline-offset-4 hover:text-foreground/80"
        >
          {articlesPage.allLabel}
          <ArrowIcon />
        </a>
      )}
    </section>
  );
}
