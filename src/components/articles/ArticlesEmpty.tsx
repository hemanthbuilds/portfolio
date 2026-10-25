import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { articlesPage } from "@/data/pages";
import { site } from "@/data/site";

// Shown if the Medium feed can't be loaded: points straight to Medium instead.
export function ArticlesEmpty() {
  return (
    <div className="rounded-lg border border-border bg-card px-6 py-8 text-card-foreground">
      <p>{articlesPage.empty}</p>
      <a
        href={`https://medium.com/@${site.mediumUsername}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-full bg-secondary px-5 text-sm font-medium text-secondary-foreground transition-opacity hover:opacity-85"
      >
        {articlesPage.allLabel}
        <ArrowIcon />
      </a>
    </div>
  );
}
