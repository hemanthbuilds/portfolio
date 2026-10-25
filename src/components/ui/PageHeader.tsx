// Big title + one-line intro at the top of each page (same treatment as the OpenAI Developers page).
export function PageHeader({ title, intro }: { title: string; intro?: string }) {
  return (
    <header>
      <h1 className="text-[2.5rem] leading-[1.1] font-medium tracking-[-0.02em] md:text-7xl">{title}</h1>
      {intro && <p className="mt-6 max-w-2xl text-[1.0625rem] text-foreground/90 md:mt-10">{intro}</p>}
    </header>
  );
}
