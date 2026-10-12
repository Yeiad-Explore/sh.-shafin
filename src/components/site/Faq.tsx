"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PlateHeader } from "./bits";
import { useSite } from "./SiteProvider";
import { pad2 } from "@/lib/format";
import { EASE_OUT } from "@/lib/motion";

/** Plus that turns into a minus: the icon rotates half a turn while its vertical bar folds away. */
function PlusMinus({ open }: { open: boolean }) {
  const reduce = useReducedMotion();
  const t = { duration: reduce ? 0 : 0.45, ease: EASE_OUT };
  return (
    <motion.span className="pm" aria-hidden="true" animate={{ rotate: open ? 180 : 0 }} transition={t}>
      <i />
      <motion.i animate={{ scaleY: open ? 0 : 1 }} transition={t} />
    </motion.span>
  );
}

export default function Faq() {
  const { data } = useSite();
  const [open, setOpen] = useState<string | null>(null);
  const reduce = useReducedMotion();
  if (!data.faqs.length) return null;

  return (
    <section id="faq" className="plate" aria-labelledby="faq-title">
      <div className="wrap">
        <PlateHeader label="FAQ" id="faq-title" title="Questions parents ask" />
        <div className="faq" data-reveal="fade">
          {data.faqs.map((f, i) => {
            const isOpen = open === f.id;
            return (
              <div className={`faq__item ${isOpen ? "is-open" : ""}`} key={f.id}>
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
                    <PlusMinus open={isOpen} />
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
                      transition={{ duration: reduce ? 0 : 0.5, ease: EASE_OUT }}
                    >
                      <motion.p
                        initial={reduce ? false : { y: -8 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.5, ease: EASE_OUT }}
                      >
                        {f.answer}
                      </motion.p>
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
