import Link from "next/link";

// Heading for a home-page section, with an optional "View all" style link on the right.
export function SectionHeader({ title, intro, link }: { title: string; intro?: string; link?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-4xl leading-[1.1] font-medium tracking-[-0.02em] md:text-5xl">{title}</h2>
        {intro && <p className="mt-4 max-w-2xl text-[1.0625rem] text-foreground/90">{intro}</p>}
      </div>
      {link && (
        <Link href={link.href} className="shrink-0 text-[0.9375rem] font-medium underline underline-offset-4 hover:text-foreground/80">
          {link.label} →
        </Link>
      )}
    </div>
  );
}
