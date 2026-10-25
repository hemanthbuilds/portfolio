import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { contactPage } from "@/data/pages";
import { site } from "@/data/site";

const cardClass =
  "flex items-center justify-between rounded-lg border border-border bg-card p-5 font-medium transition-colors hover:border-muted-foreground/40";

export function ContactLinks() {
  return (
    <>
      <a
        href={`mailto:${site.email}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-2xl font-medium underline decoration-border decoration-2 underline-offset-8 transition-colors hover:decoration-primary md:text-4xl"
      >
        {site.email}
      </a>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Email is already the big link above, so the cards are the other profiles. */}
        {site.socials.filter((social) => social.label !== "Email").map((social) => (
          <li key={social.label}>
            <a href={social.href} target="_blank" rel="noopener noreferrer" className={cardClass}>
              {social.label}
              <ArrowIcon className="size-4" />
            </a>
          </li>
        ))}
        <li>
          <a href={site.resumeUrl} target="_blank" rel="noopener noreferrer" className={cardClass}>
            {contactPage.resumeLabel}
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </li>
      </ul>
    </>
  );
}
