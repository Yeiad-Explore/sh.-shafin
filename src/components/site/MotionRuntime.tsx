"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { prefersReducedMotion, scrollToTarget, setLenis } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, SplitText);

const PAPER = { "--page-bg": "#F3EFE4", "--page-fg": "#16150F", "--page-fg-2": "#55534B", "--page-rule": "#CFC7B3" };
const SLATE = { "--page-bg": "#121614", "--page-fg": "#ECE8DC", "--page-fg-2": "#9C998F", "--page-rule": "#3B413D" };

/**
 * Page-wide motion plumbing: Lenis smooth scroll synced to ScrollTrigger, the reveal observer,
 * masked headline splits, anchor links and the paper → slate transition.
 */
export default function MotionRuntime() {
  useEffect(() => {
    (window as unknown as { __shsReady: boolean }).__shsReady = true;
    const reduced = prefersReducedMotion();
    const html = document.documentElement;
    const cleanups: (() => void)[] = [];

    // ── Smooth scroll ──
    if (!reduced) {
      const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: false });
      setLenis(lenis);
      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      cleanups.push(() => {
        gsap.ticker.remove(raf);
        lenis.destroy();
        setLenis(null);
      });
    }

    // ── Anchor links (#section) scroll smoothly and keep the hash shareable ──
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href^='#']");
      if (!a) return;
      const hash = a.getAttribute("href")!;
      if (hash === "#" || hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      scrollToTarget(hash === "#home" ? 0 : hash);
      history.replaceState(null, "", hash);
    };
    document.addEventListener("click", onClick);
    cleanups.push(() => document.removeEventListener("click", onClick));

    // ── Reveal observer: once, at 20% into the viewport ──
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            entry.target.dispatchEvent(new CustomEvent("reveal"));
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0 },
    );
    const observeAll = (scope: ParentNode) =>
      scope.querySelectorAll("[data-reveal]:not(.is-in), [data-inview]:not(.is-in)").forEach((el) => io.observe(el));
    observeAll(document);
    const mo = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => n instanceof HTMLElement && observeAll(n.parentNode ?? n));
    });
    mo.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => {
      io.disconnect();
      mo.disconnect();
    });

    // ── Masked line reveals for plate titles ──
    const splits: SplitText[] = [];
    const runSplits = () => {
      document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
        let played = false;
        let tween: gsap.core.Tween | null = null;
        const split = SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit(self) {
            el.classList.add("is-split");
            if (reduced) return;
            // returned so SplitText carries progress across re-splits (fonts, resize)
            tween = gsap.from(self.lines, { yPercent: 110, duration: 0.9, ease: "expo.out", stagger: 0.045, paused: !played });
            return tween;
          },
        });
        splits.push(split);
        const play = () => {
          if (played) return;
          played = true;
          if (reduced) {
            gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 });
            return;
          }
          tween?.play();
        };
        if (el.classList.contains("is-in")) play();
        else el.addEventListener("reveal", play, { once: true });
        if (!el.hasAttribute("data-inview")) {
          el.setAttribute("data-inview", "");
          io.observe(el);
        }
      });
    };
    if (document.fonts?.status === "loaded") runSplits();
    else document.fonts?.ready.then(runSplits);
    cleanups.push(() => splits.forEach((s) => s.revert()));

    // ── Paper → slate as the Schedule plate enters, and back as it leaves ──
    const slateEl = document.getElementById("schedule");
    if (slateEl) {
      if (reduced) {
        const st = ScrollTrigger.create({
          trigger: slateEl,
          start: "top 50%",
          end: "bottom 50%",
          onToggle: (self) => gsap.set(html, self.isActive ? SLATE : PAPER),
        });
        cleanups.push(() => st.kill());
      } else {
        const enter = gsap.fromTo(html, { ...PAPER }, {
          ...SLATE,
          ease: "none",
          scrollTrigger: { trigger: slateEl, start: "top 70%", end: "top 15%", scrub: 0.6 },
        });
        const leave = gsap.fromTo(html, { ...SLATE }, {
          ...PAPER,
          ease: "none",
          immediateRender: false,
          scrollTrigger: { trigger: slateEl, start: "bottom 75%", end: "bottom 20%", scrub: 0.6 },
        });
        cleanups.push(() => {
          enter.scrollTrigger?.kill();
          leave.scrollTrigger?.kill();
          enter.kill();
          leave.kill();
          gsap.set(html, { clearProps: "--page-bg,--page-fg,--page-fg-2,--page-rule" });
        });
      }
    }

    // Layout settles after fonts/images: re-measure every trigger.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    cleanups.push(() => window.removeEventListener("load", refresh));

    // Deep links (#courses) land correctly once the layout is measured.
    // The Subjects pin inserts its spacer after first paint, so jump again once triggers are refreshed.
    if (location.hash.length > 1) {
      const hash = location.hash;
      let done = false;
      const jump = () => {
        if (done || !document.querySelector(hash)) return;
        done = true;
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        scrollToTarget(hash, { duration: 0.01 });
      };
      const onRefresh = () => setTimeout(jump, 60);
      ScrollTrigger.addEventListener("refresh", onRefresh);
      const fallback = setTimeout(jump, 1500);
      cleanups.push(() => {
        clearTimeout(fallback);
        ScrollTrigger.removeEventListener("refresh", onRefresh);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
