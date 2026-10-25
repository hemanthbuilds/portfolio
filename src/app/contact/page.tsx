import type { Metadata } from "next";
import { ContactLinks } from "@/components/contact/ContactLinks";
import { PageHeader } from "@/components/ui/PageHeader";
import { contactPage } from "@/data/pages";

export const metadata: Metadata = { title: contactPage.title, description: contactPage.intro };

export default function ContactPage() {
  return (
    <section className="page-container py-24 md:py-32">
      <PageHeader title={contactPage.title} intro={contactPage.intro} />
      <div className="mt-12">
        <ContactLinks />
      </div>
    </section>
  );
}
