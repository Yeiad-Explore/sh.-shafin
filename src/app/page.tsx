import { getSiteData } from "@/lib/data";
import { SiteProvider } from "@/components/site/SiteProvider";
import MotionRuntime from "@/components/site/MotionRuntime";
import Preloader from "@/components/site/Preloader";
import Navbar from "@/components/site/Navbar";
import GrowthLine from "@/components/site/GrowthLine";
import Hero from "@/components/site/Hero";
import About from "@/components/site/About";
import Subjects from "@/components/site/Subjects";
import Courses from "@/components/site/Courses";
import Schedule from "@/components/site/Schedule";
import Results from "@/components/site/Results";
import Faq from "@/components/site/Faq";
import Contact from "@/components/site/Contact";
import Footer from "@/components/site/Footer";
import WhatsAppButton from "@/components/site/WhatsAppButton";
import ChatWidget from "@/components/site/ChatWidget";
import type { SectionKey } from "@/lib/types";

const SECTION: Record<SectionKey, () => React.ReactNode> = {
  about: About,
  subjects: Subjects,
  courses: Courses,
  schedule: Schedule,
  results: Results,
  faq: Faq,
  contact: Contact,
};

export default async function Home() {
  const data = await getSiteData();
  const { settings } = data;
  const order = settings.section_order.filter((k) => SECTION[k] && settings.sections[k] !== false);
  const visible = order.filter((k) => (k === "faq" ? data.faqs.length > 0 : k === "subjects" ? data.subjects.length > 0 : true));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${siteUrl}/#shafin`,
        name: "Md. Samiul Haque Shafin",
        alternateName: "S.H. Shafin",
        jobTitle: "Science Teacher",
        description: settings.bio,
        url: siteUrl,
        image: settings.photo_url ? new URL(settings.photo_url, siteUrl).toString() : undefined,
        email: settings.email ?? undefined,
        telephone: settings.phone ?? undefined,
        address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" },
        alumniOf: data.education.map((e) => ({ "@type": "EducationalOrganization", name: e.institution })),
        knowsAbout: data.subjects.map((s) => s.name),
        sameAs: [settings.facebook, settings.youtube, settings.instagram].filter(Boolean),
      },
      ...data.courses.map((c) => ({
        "@type": "Course",
        name: c.title,
        description: c.summary ?? c.title,
        provider: { "@id": `${siteUrl}/#shafin` },
        educationalLevel: c.class_level === "9-10" || c.class_level === "10" ? "SSC" : "HSC",
      })),
      ...(data.faqs.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: data.faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
            },
          ]
        : []),
    ],
  };

  return (
    <SiteProvider data={data}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Preloader />
      <div className="fx" aria-hidden="true">
        <div className="fx__aurora">
          <span className="fx__blob fx__blob--a" />
          <span className="fx__blob fx__blob--b" />
          <span className="fx__blob fx__blob--c" />
        </div>
        <div className="fx__spot" />
        <div className="fx__noise" />
      </div>
      <Navbar sections={visible} />
      <div className="page">
        <GrowthLine />
        <main id="main">
          <Hero />
          {visible.map((k) => {
            const Section = SECTION[k];
            return <Section key={k} />;
          })}
        </main>
        <Footer sections={visible} />
      </div>
      <WhatsAppButton />
      <ChatWidget />
      <MotionRuntime />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </SiteProvider>
  );
}
