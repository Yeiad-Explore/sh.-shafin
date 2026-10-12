"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { markReady } from "@/lib/motion";
import Logo from "./Logo";

/** First visit only, max 1.4s: the shutter logo scales in, then the screen clears. */
export default function Preloader() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const el = ref.current;
    if (!html.classList.contains("preload") || !el) {
      markReady();
      return;
    }
    const logo = el.querySelector(".preloader__logo");
    const finish = () => {
      html.classList.remove("preload");
      try {
        sessionStorage.setItem("shs-visited", "1");
      } catch {}
      markReady();
    };
    const tl = gsap.timeline({ onComplete: finish });
    tl.fromTo(logo, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(1.7)" })
      .to(el, { opacity: 0, duration: 0.3, ease: "power1.out" }, 1.0);
    return () => {
      tl.kill();
      finish();
    };
  }, []);

  return (
    <div ref={ref} className="preloader" aria-hidden="true">
      <div className="preloader__mark">
        <Logo size={72} className="preloader__logo" />
      </div>
    </div>
  );
}
