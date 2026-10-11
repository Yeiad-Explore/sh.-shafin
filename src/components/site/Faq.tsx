"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PlateHeader } from "./bits";
import { useSite } from "./SiteProvider";
import { pad2 } from "@/lib/format";

export default function Faq({ n }: { n: number }) {
  const { data } = useSite();
  const [open, setOpen] = useState<string | null>(null);
  const reduce = useReducedMotion();
  if (!data.faqs.length) return null;

  return (
    <section id="faq" className="plate" aria-labelledby="faq-title">
      <div className="wrap">
        <PlateHeader n={n} label="FAQ" id="faq-title" title="Questions parents ask" />
        <div className="faq" data-reveal="fade">
          {data.faqs.map((f, i) => {
            const isOpen = open === f.id;
            return (
              <div className="faq__item" key={f.id}>
                <h3 style={{ margin: 0 }}>
                  <button
                    type="button"
                    className="faq__q"
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${f.id}`}
                    id={`faq-q-${f.id}`}
                    onClick={() => setOpen(isOpen ? null : f.id)}
                  >
                    <span className="t-label muted">Q.{pad2(i + 1)}</span>
                    <span className="faq__q-text">{f.question}</span>
                    <span className="plus" aria-hidden="true" />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-a-${f.id}`}
                      role="region"
                      aria-labelledby={`faq-q-${f.id}`}
                      className="faq__a"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p>{f.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
