import Image from "next/image";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { articlesPage } from "@/data/pages";
import type { Article } from "@/lib/medium";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

// A Medium article: cover image, title, excerpt, date and tags. The whole card opens it on Medium.
export function ArticleCard({ article }: { article: Article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-muted-foreground/40"
    >
      {article.image && (
        // The Medium cover, tinted in the site blue so every article matches; it warms back toward its
        // own colours on hover. (Styles: .article-cover in globals.css.)
        <div className="article-cover relative aspect-[5/2] overflow-hidden border-b border-border">
          <Image src={article.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          <span aria-hidden="true" className="article-cover-tint absolute inset-0" />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm text-muted-foreground">
          <time dateTime={article.date}>{dateFormat.format(new Date(article.date))}</time>
        </p>
        <h3 className="mt-2 text-[1.1875rem] leading-snug font-medium">{article.title}</h3>
        <p className="mt-3 leading-relaxed text-card-foreground/80">{article.excerpt}</p>
        {/* Pushed to the bottom with room for two rows, so the topics line up across cards. */}
        {article.tags.length > 0 && (
          <ul className="mt-auto flex min-h-[5.25rem] flex-wrap content-start gap-2 pt-5">
            {article.tags.slice(0, 4).map((tag) => (
              <li key={tag} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                {tag.replace(/-/g, " ")}
              </li>
            ))}
          </ul>
        )}
        <span className={`inline-flex items-center gap-1.5 pt-6 text-[0.9375rem] font-medium ${article.tags.length ? "" : "mt-auto"}`}>
          {articlesPage.readLabel}
          <ArrowIcon />
        </span>
      </div>
    </a>
  );
}

export function ArticleGrid({ articles }: { articles: Article[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {articles.map((article) => (
        <li key={article.url}>
          <ArticleCard article={article} />
        </li>
      ))}
    </ul>
  );
}
