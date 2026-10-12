"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getLenis, prefersReducedMotion, scrollToTarget } from "@/lib/motion";
import { pad2 } from "@/lib/format";
import type { SectionKey } from "@/lib/types";

const LABELS: Partial<Record<SectionKey, string>> = {
  about: "About",
  subjects: "Subjects",
  courses: "Courses",
  schedule: "Schedule",
  results: "Results",
  contact: "Contact",
};

const TINT: Partial<Record<SectionKey, string>> = {
  about: "var(--accent)",
  subjects: "var(--accent-current)",
  courses: "var(--chem)",
  schedule: "var(--accent-2)",
  results: "var(--bio)",
  contact: "var(--math)",
};

export default function Navbar({ sections }: { sections: SectionKey[] }) {
  const links = sections.filter((s) => LABELS[s]);
  const [active, setActive] = useState<SectionKey | null>(null);
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Active section
  useEffect(() => {
    const els = links.map((k) => document.getElementById(k)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id as SectionKey);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const hero = document.getElementById("home");
    const heroIo = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setActive(null);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    if (hero) heroIo.observe(hero);
    return () => {
      io.disconnect();
      heroIo.disconnect();
    };
  }, [links.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hide on scroll down after the hero, return on scroll up; progress line.
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      const pastHero = y > window.innerHeight * 0.9;
      setSolid(y > 24);
      if (Math.abs(y - lastY) > 6) {
        setHidden(pastHero && y > lastY);
        lastY = y;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Mobile menu: lock scroll, close on Esc
  useEffect(() => {
    const lenis = getLenis();
    if (open) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (hash: string) => {
    setOpen(false);
    setTimeout(() => {
      scrollToTarget(hash);
      history.replaceState(null, "", hash);
    }, open ? 260 : 0);
  };

  const reduced = typeof window !== "undefined" && prefersReducedMotion();

  return (
    <>
      <nav className={`nav ${hidden && !open ? "is-hidden" : ""} ${solid ? "is-solid" : ""}`} aria-label="Main">
        <div className="wrap nav__inner">
          <a href="#home" className="nav__mono" aria-label="S.H. Shafin — back to top">
            <span className="nav__mono-dot" />
            S.H.S
          </a>
          <ul className="nav__links">
            {links.map((k, i) => (
              <li key={k}>
                <a href={`#${k}`} className={`nav__link ${active === k ? "is-active" : ""}`} aria-current={active === k ? "true" : undefined}>
                  <span className="nav__link-n">{pad2(i + 1)}</span>
                  <span className="nav__link-t">{LABELS[k]}</span>
                  {active === k && (
                    <motion.span
                      layoutId="nav-leaf"
                      className="nav__leaf"
                      style={{ "--tint": TINT[k] } as CSSProperties}
                      transition={{ type: "spring", stiffness: 220, damping: 26 }}
                    />
                  )}
                </a>
              </li>
            ))}
          </ul>
          <div className="nav__right">
            {sections.includes("contact") && (
              <a href="#contact" className="btn btn--ink btn--sm nav__enroll">
                Enroll
              </a>
            )}
            <button
              ref={menuBtnRef}
              type="button"
              className="nav__menu-btn"
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
        <span ref={progressRef} className="nav__progress" aria-hidden="true" />
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="site-menu"
            className="menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: reduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.span
              className="menu__line"
              aria-hidden="true"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: reduced ? 0 : 0.9, ease: [0.65, 0, 0.35, 1], delay: 0.1 }}
            />
            <ul className="menu__list">
              {links.map((k, i) => (
                <li key={k} style={{ overflow: "hidden" }}>
                  <motion.a
                    href={`#${k}`}
                    className="menu__link"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      go(`#${k}`);
                    }}
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: reduced ? 0 : 0.9, ease: [0.16, 1, 0.3, 1], delay: reduced ? 0 : 0.15 + i * 0.045 }}
                  >
                    <small>{pad2(i + 1)}</small>
                    {LABELS[k]}
                  </motion.a>
                </li>
              ))}
            </ul>
            {sections.includes("contact") && (
              <a
                href="#contact"
                className="btn btn--ink"
                style={{ alignSelf: "flex-start" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  go("#contact");
                }}
              >
                Book a free trial
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
