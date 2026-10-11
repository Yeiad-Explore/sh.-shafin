"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useSite } from "./SiteProvider";
import { useGrowthReach } from "@/lib/growth";
import { BLOOM_EVENT, scrollToTarget } from "@/lib/motion";
import { waLink } from "@/lib/format";

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

export default function Footer() {
  const { data } = useSite();
  const { settings } = data;
  const [open, setOpen] = useState(false);
  const ref = useGrowthReach<HTMLDivElement>(() => setOpen(true));

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(BLOOM_EVENT, on);
    return () => window.removeEventListener(BLOOM_EVENT, on);
  }, []);

  const wa = waLink(settings.whatsapp);
  const socials = [
    settings.facebook && { href: settings.facebook, label: "Facebook" },
    settings.youtube && { href: settings.youtube, label: "YouTube" },
    settings.instagram && { href: settings.instagram, label: "Instagram" },
    wa && { href: wa, label: "WhatsApp" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <footer className="footer" aria-label="Footer">
      <div className="wrap">
        <div ref={ref} data-growth="end" data-gx="center" data-gy="bottom" data-gdy="-34" style={{ display: "inline-block" }}>
          <Bloom open={open} />
        </div>
        <p className="t-label muted" style={{ margin: "0 0 12px" }}>
          Grown in Dhaka · since {Math.min(...(data.experience.length ? data.experience.map((e) => e.start_year) : [2022]))}
        </p>
        <p className="footer__name t-display" aria-label="Md. Samiul Haque Shafin">
          Samiul Haque Shafin
        </p>
        <div className="footer__row t-label">
          <div className="footer__links">
            {settings.email && (
              <a href={`mailto:${settings.email}`} className="link-draw">
                {settings.email}
              </a>
            )}
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="link-draw">
                {s.label}
              </a>
            ))}
            <a href="#contact" className="link-draw">
              Enroll
            </a>
          </div>
          <div className="footer__links">
            <span style={{ display: "inline-flex", alignItems: "center", minHeight: 44 }}>© 2026 S.H. Shafin</span>
            <button type="button" className="link-draw" onClick={() => scrollToTarget(0, { duration: 1.1 })}>
              Back to top ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
