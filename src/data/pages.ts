// Titles, intros and small bits of copy for each page. TODO(Hem): reword any of these.

export const projectsPage = {
  title: "Projects",
  intro: "AI products I've built: what problem each one solves and what it's built with.",
  noLinks: "Prototyping…",
  // The subsections shown after the regular projects.
  aiProducts: { title: "AI Products", intro: "Products I've built with AI, live and ready to try." },
  biMarketing: {
    title: "Business Intelligence & Analytics",
    intro: "Turning raw data into dashboards and decisions.",
  },
};

export const articlesPage = {
  title: "Articles",
  intro: "Notes on building AI products: what worked, what didn't, and what I'd do differently.",
  empty: "Couldn't load articles right now. They're all on Medium in the meantime.",
  readLabel: "Read on Medium",
  allLabel: "All articles on Medium",
};

export const aboutPage = {
  title: "About",
  skillsHeading: "Skills",
};

export const contactPage = {
  title: "Contact",
  intro: "Open to roles and collaborations in generative AI. Email is the fastest way to reach me.",
  emailLabel: "Email me",
  resumeLabel: "Download resume",
};

// Sections on the home page, below the landing screen (in this order).
export const homeSections = {
  projects: { title: "Projects", intro: projectsPage.intro, link: "View all projects" },
  articles: { title: "Articles", intro: articlesPage.intro, link: "All articles", count: 3 },
  about: { title: "About", link: "More about me" },
  contact: { title: "Contact", intro: contactPage.intro },
};
