"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { PlateHeader, LeafGlyph, tilt } from "./bits";
import { useSite } from "./SiteProvider";
import { useGrowthReach } from "@/lib/growth";
import { prefersReducedMotion } from "@/lib/motion";
import { SUBJECT_VAR } from "@/lib/format";
import type { Education, Experience, Subject } from "@/lib/types";

const short = (deg: string) =>
  deg
    .replace("Bachelor of Science", "B.Sc.")
    .replace("Master of Science", "M.Sc.")
    .replace("Bachelor of Arts", "B.A.")
    .replace("Higher Secondary Certificate", "HSC")
    .replace("Secondary School Certificate", "SSC");

interface Node {
  key: string;
  year: string;
  title: string;
  detail: string;
  accent?: boolean;
}

function buildNodes(education: Education[], experience: Experience[], subjects: Subject[]): Node[] {
  const nodes: (Node & { sort: number; seq: number })[] = [];
  let seq = 0;
  for (const e of education) {
    const years = e.year.match(/\d{4}/g) ?? [];
    const where = [e.institution, e.notes?.includes("University of Dhaka") ? "University of Dhaka affiliate" : null].filter(Boolean).join(" (") + (e.notes?.includes("University of Dhaka") ? ")" : "");
    if (years.length >= 2 && years[0] && years[1]) {
      nodes.push({ key: `${e.id}-a`, year: years[0], title: `${short(e.degree)} begins`, detail: [where, e.concentration].filter(Boolean).join(" · "), sort: +years[0], seq: seq++ });
      nodes.push({ key: `${e.id}-b`, year: years[1], title: `${short(e.degree)} completed`, detail: e.concentration ?? "", sort: +years[1], seq: seq++ });
    } else if (years[0]) {
      nodes.push({ key: e.id, year: years[0], title: short(e.degree), detail: [e.institution, e.concentration].filter(Boolean).join(" · "), sort: +years[0], seq: seq++ });
    }
  }
  const sortedExp = [...experience].sort((a, b) => a.start_year - b.start_year);
  sortedExp.forEach((x, i) => {
    nodes.push({
      key: `${x.id}-s`,
      year: String(x.start_year),
      title: i === 0 ? "Starts teaching" : x.role,
      detail: [x.role, x.institution, "SSC & HSC science"].filter(Boolean).join(" · "),
      accent: i === 0,
      sort: x.start_year,
      seq: seq++,
    });
    if (x.end_year) nodes.push({ key: `${x.id}-e`, year: String(x.end_year), title: `Leaves ${x.institution ?? "role"}`, detail: x.role, sort: x.end_year, seq: seq++ });
  });
  if (experience.some((x) => !x.end_year)) {
    nodes.push({ key: "now", year: "Now", title: "Teaching", detail: subjects.map((s) => s.name).join(", "), sort: 9999, seq: seq++ });
  }
  return nodes.sort((a, b) => a.sort - b.sort || a.seq - b.seq);
}

function TimelineItem({ node }: { node: Node }) {
  const [reached, setReached] = useState(false);
  const ref = useGrowthReach<HTMLLIElement>(() => setReached(true), -40);
  return (
    <li ref={ref} className={`timeline__item ${node.accent ? "timeline__item--accent" : ""} ${reached ? "is-reached is-in" : ""}`}>
      <span className="timeline__node" aria-hidden="true">
        {node.accent && <LeafGlyph className="timeline__leaf" />}
      </span>
      <div className="timeline__card">
        <span className="timeline__year">{node.year}</span>
        <div className="timeline__title t-label">{node.title}</div>
        {node.detail && <p className="timeline__detail">{node.detail}</p>}
      </div>
    </li>
  );
}

export default function About({ n }: { n: number }) {
  const { data } = useSite();
  const { settings, education, experience, specialties, subjects } = data;
  const nodes = useMemo(() => buildNodes(education, experience, subjects), [education, experience, subjects]);
  const bioRef = useRef<HTMLParagraphElement>(null);

  // Bio: words go from 25% to 100% as you read — the only scrubbed text on the site.
  useEffect(() => {
    const el = bioRef.current;
    if (!el || prefersReducedMotion()) return;
    const words = el.querySelectorAll(".w");
    const tween = gsap.to(words, {
      opacity: 1,
      ease: "none",
      stagger: 0.1,
      scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 42%", scrub: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [settings.bio]);

  return (
    <section id="about" className="plate about" aria-labelledby="about-title">
      <div className="wrap">
        <PlateHeader n={n} label="About" id="about-title" title="A botanist who teaches" />
        <div className="about__grid">
          <div className="about__left">
            <p ref={bioRef} className="about__bio">
              {settings.bio.split(/\s+/).map((w, i) => (
                <span key={i} className="w">
                  {w}{" "}
                </span>
              ))}
            </p>
            {settings.philosophy && (
              <blockquote className="about__philosophy" data-reveal="fade">
                {settings.philosophy}
              </blockquote>
            )}

            {specialties.length > 0 && (
              <ul className="about__tags" data-inview="" aria-label="Specialties">
                {specialties.map((s, i) => (
                  <li
                    key={s.id}
                    className="tag tag-drop"
                    data-subject={s.subject ?? undefined}
                    style={{ "--rot": tilt(i), "--delay": `${i * 40}ms`, "--tag-c": s.subject ? SUBJECT_VAR[s.subject] : undefined } as CSSProperties}
                  >
                    {s.label}
                  </li>
                ))}
              </ul>
            )}

            {education.length > 0 && (
              <div className="edu" data-reveal="fade">
                {education.map((e) => (
                  <div className="edu__row" key={e.id}>
                    <span className="t-label muted">{e.year}</span>
                    <div>
                      <div className="edu__deg">
                        {e.degree}
                        {e.concentration ? ` — ${e.concentration}` : ""}
                      </div>
                      <div className="muted" style={{ fontSize: "0.9375rem" }}>
                        {e.institution}
                        {e.notes ? ` · ${e.notes}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="about__right">
            <div className="t-label muted" style={{ marginBottom: 24 }}>
              Growth record
            </div>
            <div style={{ position: "relative" }}>
              <span data-growth="point" data-gx="center" data-gy="top" className="timeline-anchor" aria-hidden="true" />
              <ol className="timeline" aria-label="Education and teaching timeline">
                {nodes.map((node) => (
                  <TimelineItem key={node.key} node={node} />
                ))}
              </ol>
              <span data-growth="point" data-gx="center" data-gy="bottom" className="timeline-anchor timeline-anchor--end" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
