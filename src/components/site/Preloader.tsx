"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { markReady } from "@/lib/motion";

/** PL. 00 — first visit only, max 1.4s: an ink dot drops, pulls into a stroke, S.H.S writes beside it. */
export default function Preloader() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const el = ref.current;
    if (!html.classList.contains("preload") || !el) {
      markReady();
      return;
    }
    const dot = el.querySelector(".preloader__dot");
    const stem = el.querySelector(".preloader__stem");
    const letters = el.querySelectorAll(".preloader__mono span");
    const finish = () => {
      html.classList.remove("preload");
      try {
        sessionStorage.setItem("shs-visited", "1");
      } catch {}
      markReady();
    };
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(dot, { scale: 1, duration: 0.4, ease: "back.out(2.2)" })
      .to(stem, { scaleY: 1, duration: 0.45, ease: "power2.inOut" }, 0.4)
      .from(letters, { opacity: 0, duration: 0.05, stagger: 0.08 }, 0.45)
      .to(stem, { scaleY: 6, opacity: 0, duration: 0.4, ease: "power3.in" }, 1.0)
      .to(el, { opacity: 0, duration: 0.3, ease: "power1.out" }, 1.1);
    return () => {
      tl.kill();
      finish();
    };
  }, []);

  return (
    <div ref={ref} className="preloader" aria-hidden="true">
      <div className="preloader__mark">
        <span className="preloader__dot" />
        <span className="preloader__stem" />
        <span className="preloader__mono">
          {"S.H.S".split("").map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </span>
      </div>
    </div>
  );
}
