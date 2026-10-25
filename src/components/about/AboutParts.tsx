import Image from "next/image";
import { about, skillGroups } from "@/data/about";
import { site } from "@/data/site";

// Photo (or initials until a photo is added in src/data/about.ts) next to the intro paragraphs.
export function AboutIntro() {
  return (
    <div className="grid gap-10 md:grid-cols-[16rem_1fr] md:gap-14">
      <div className="relative aspect-square w-48 overflow-hidden rounded-lg border border-border bg-card md:w-full">
        {about.photo ? (
          <Image src={about.photo} alt={about.photoAlt} fill sizes="16rem" className="translate-y-[10%] scale-125 object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-4xl font-medium text-muted-foreground">
            {site.fullName
              .split(" ")
              .map((word) => word[0])
              .join("")}
          </span>
        )}
      </div>
      <div className="max-w-2xl space-y-5 text-[1.0625rem] leading-relaxed text-foreground/90">
        {about.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}

export function SkillGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {skillGroups.map((group) => (
        <li key={group.name} className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-medium">{group.name}</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-card-foreground/75">
            {group.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
