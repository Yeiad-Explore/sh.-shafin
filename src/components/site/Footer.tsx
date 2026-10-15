"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useSite } from "./SiteProvider";
import { useGrowthReach } from "@/lib/growth";
import { BLOOM_EVENT, EASE_OUT, scrollToTarget } from "@/lib/motion";
import { telLink, waLink } from "@/lib/format";
import { useMedia, useYear } from "@/lib/hooks";
import type { SectionKey } from "@/lib/types";
import { ShutterWordmark } from "@/components/ui/shutter-glyph-footer";

const SECTION_LABEL: Record<SectionKey, string> = {
  about: "About",
  subjects: "Subjects",
  courses: "Courses",
  schedule: "Schedule",
  results: "Results",
  faq: "FAQ",
  contact: "Contact",
};

const PETALS = 6;

function Bloom({ open }: { open: boolean }) {
  return (
    <svg viewBox="-60 -60 120 150" className={`footer__bloom ${open ? "is-in" : ""}`} role="img" aria-label="A line-drawn flower">
      <path className="draw" pathLength={1} style={{ "--delay": "0ms", "--dur": "600ms" } as CSSProperties} d="M0 90 C -2 60, 4 34, 0 12" />
      <path className="draw" pathLength={1} style={{ "--delay": "300ms", "--dur": "500ms" } as CSSProperties} d="M0 62 C -14 56, -26 60, -30 70 C -18 74, -6 70, 0 62 Z" />
      {Array.from({ length: PETALS }, (_, i) => {
        const a = (360 / PETALS) * i;
        return (
          <path
            key={i}
            className="draw"
            pathLength={1}
            transform={`rotate(${a})`}
            style={{ "--delay": `${500 + i * 120}ms`, "--dur": "520ms" } as CSSProperties}
            d="M0 -10 C -14 -24, -12 -44, 0 -52 C 12 -44, 14 -24, 0 -10"
          />
        );
      })}
      <circle className="draw" pathLength={1} style={{ "--delay": "1250ms", "--dur": "300ms" } as CSSProperties} r="9" />
    </svg>
  );
}

export default function Footer({ sections }: { sections: SectionKey[] }) {
  const { data } = useSite();
  const { settings } = data;
  const [open, setOpen] = useState(false);
  const ref = useGrowthReach<HTMLDivElement>(() => setOpen(true));

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(BLOOM_EVENT, on);
    return () => window.removeEventListener(BLOOM_EVENT, on);
  }, []);

  const reduce = useReducedMotion();
  const year = useYear();
  const narrow = useMedia("(max-width: 720px)");
  const mark = narrow ? "Samiul\nHaque\nShafin *" : "Samiul Haque\nShafin *";
  const wa = waLink(settings.whatsapp, "Hi, I'd like to know about your science classes.");
  const tel = telLink(settings.phone);
  const since = Math.min(...(data.experience.length ? data.experience.map((e) => e.start_year) : [2022]));
  const socials = [
    settings.facebook && { href: settings.facebook, label: "Facebook" },
    settings.youtube && { href: settings.youtube, label: "YouTube" },
    settings.instagram && { href: settings.instagram, label: "Instagram" },
  ].filter(Boolean) as { href: string; label: string }[];
  const contact = [
    wa && settings.whatsapp && { href: wa, label: "WhatsApp", value: settings.whatsapp, external: true },
    tel && settings.phone && { href: tel, label: "Phone", value: settings.phone, external: false },
    settings.email && { href: `mailto:${settings.email}`, label: "Email", value: settings.email, external: false },
  ].filter(Boolean) as { href: string; label: string; value: string; external: boolean }[];
  const place = settings.teaching_place || settings.address;
  let trialHref: "#schedule" | "#contact" | null = null;
  if (sections.includes("schedule") && data.trialSlots.length > 0) trialHref = "#schedule";
  else if (sections.includes("contact")) trialHref = "#contact";
  const col = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "0px 0px -8% 0px" },
    transition: { duration: 0.6, ease: EASE_OUT, delay: i * 0.08 },
  });

  return (
    <footer className="footer" aria-label="Footer">
      <div className="wrap">
        <div ref={ref} data-growth="end" data-gx="center" data-gy="bottom" data-gdy="-34" style={{ display: "inline-block" }}>
          <Bloom open={open} />
        </div>
        <p className="t-label muted" style={{ margin: "0 0 12px" }}>
          Grown in Dhaka · since {since}
        </p>
        {/* One wordmark: two lines, or a word per line on phones. "*" marks where the shutter sits, after the name. */}
        <ShutterWordmark
          className="footer__name"
          text={mark}
          shutterAt={mark.indexOf("*")}
          label="Md. Samiul Haque Shafin"
          ink="var(--fg)"
          shutterInk="var(--accent)"
          style={narrow ? { maxWidth: 420 } : undefined}
        />

        <div className="footer__grid">
          <motion.div className="footer__cta" {...col(0)}>
            <p className="footer__cta-title">Start with one free class.</p>
            <p className="muted">Biology, Physics, Chemistry and Math for SSC and HSC students.</p>
            {trialHref && (
              <a href={trialHref} className="btn btn--ink btn--sm">
                Book a free trial
              </a>
            )}
          </motion.div>

          {(contact.length > 0 || place || sections.includes("contact")) && (
            <motion.div {...col(1)}>
              <h2 className="footer__head t-label">Contact</h2>
              <ul className="footer__list">
                {sections.includes("contact") && (
                  <li>
                    <span className="t-label muted">Enrollment</span>
                    <a href="#contact" className="link-draw">
                      Send the enrollment form
                    </a>
                  </li>
                )}
                {contact.map((c) => (
                  <li key={c.label}>
                    <span className="t-label muted">{c.label}</span>
                    <a href={c.href} className="link-draw" {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {c.value}
                    </a>
                  </li>
                ))}
                {place && (
                  <li>
                    <span className="t-label muted">Classes</span>
                    <span>{place}</span>
                  </li>
                )}
              </ul>
            </motion.div>
          )}

          <motion.nav aria-label="Footer" {...col(2)}>
            <h2 className="footer__head t-label">Explore</h2>
            <ul className="footer__list footer__list--links">
              {sections.map((k) => (
                <li key={k}>
                  <a href={`#${k}`} className="link-draw">
                    {SECTION_LABEL[k]}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>

          {socials.length > 0 && (
            <motion.div {...col(3)}>
              <h2 className="footer__head t-label">Follow</h2>
              <ul className="footer__list footer__list--links">
                {socials.map((so) => (
                  <li key={so.label}>
                    <a href={so.href} target="_blank" rel="noopener noreferrer" className="link-draw">
                      {so.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        <div className="footer__row t-label">
          <span>© {year} S.H. Shafin · Science teacher, Dhaka</span>
          <button type="button" className="link-draw" onClick={() => scrollToTarget(0, { duration: 1.1 })}>
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
