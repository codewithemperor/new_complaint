"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Plus } from "lucide-react";

const faqs = [
  {
    q: "What is KwaraMOc Complaints?",
    a: "A public system from the Kwara State Ministry of Communications for reporting issues across government departments and following their progress from submission to resolution.",
    category: "General",
  },
  {
    q: "How long does a complaint take to resolve?",
    a: "Most complaints are classified within 48 hours. Full resolution time depends on the department and the nature of the issue — you'll get an email at every stage.",
    category: "Process",
  },
  {
    q: "Is my complaint confidential?",
    a: "Yes. Your details are only visible to the assigned department and reviewing staff, and are never shared publicly.",
    category: "Privacy",
  },
  {
    q: "Can I submit a complaint anonymously?",
    a: "You can leave contact details optional, but adding an email lets us send you tracking updates and a resolution notice.",
    category: "Privacy",
  },
  {
    q: "Can I attach photos or documents as evidence?",
    a: "Yes, the complaint form supports image and document attachments to help departments assess your issue faster.",
    category: "Process",
  },
  {
    q: "What if I'm not satisfied with the resolution?",
    a: "Every resolved complaint can be reopened with one click directly from your tracking page.",
    category: "Process",
  },
  {
    q: "Which departments are covered?",
    a: "All Kwara State government departments are integrated, covering Works, Health, Education, Agriculture, and more across all 16 LGAs.",
    category: "General",
  },
  {
    q: "How do I track my complaint?",
    a: "Use the ticket code and 6-digit passcode provided at submission on the Track Status page. You'll also receive email updates at every stage.",
    category: "Process",
  },
];

const CATEGORIES = ["All", "General", "Process", "Privacy"] as const;

// Category → token-based classes only (no raw color names).
const categoryStyles: Record<string, string> = {
  General: "bg-primary-50 text-primary-700 ring-primary-600/20",
  Process: "bg-secondary-50 text-secondary-700 ring-secondary-600/20",
  Privacy: "bg-neutral-50 text-muted-foreground ring-border",
};

interface FaqSectionProps {
  onComplaintOpen: () => void;
}

export default function FaqSection({ onComplaintOpen }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");

  const filtered = faqs.filter((f) => {
    const matchesQuery =
      query === "" ||
      f.q.toLowerCase().includes(query.toLowerCase()) ||
      f.a.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || f.category === category;
    return matchesQuery && matchesCategory;
  });

  return (
    <section id="faq" className="bg-background py-24 sm:py-32">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:flex-row lg:px-8">
        {/* Sticky left column — stays pinned while the right list scrolls */}
        <div className="lg:sticky lg:top-24 lg:h-fit lg:w-1/3 lg:self-start">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-600">
            Support
          </span>
          <h2 className="font-heading mt-3 text-4xl font-semibold leading-tight tracking-tight text-foreground">
            Frequently asked questions
          </h2>
          {/* <p className="mt-4 text-muted-foreground">
            Can&apos;t find what you&apos;re looking for?{" "}
            <button
              onClick={onComplaintOpen}
              className="font-medium text-primary-600 hover:underline"
            >
              Reach out to us
            </button>
            .
          </p> */}

          {/* Search */}
          {/* <div className="relative mt-8">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full rounded-xl border border-border bg-neutral-50/40 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary-500 focus:bg-background focus:ring-1 focus:ring-primary-500"
            />
          </div> */}

          {/* Category filter */}
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  category === cat
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-50 text-muted-foreground hover:bg-neutral-50/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ list */}
        <div className="lg:w-2/3">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Search size={40} className="mx-auto text-muted-foreground/40" />
              <p className="mt-4 text-sm text-muted-foreground">
                No questions match your search.
              </p>
            </div>
          ) : (
            filtered.map((f) => {
              const index = faqs.indexOf(f);
              const isOpen = openIndex === index;
              return (
                <div key={f.q} className="border-b border-border py-5">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-base font-semibold text-foreground">
                        {f.q}
                      </span>
                      <span
                        className={`hidden rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset sm:inline-flex ${categoryStyles[f.category]}`}
                      >
                        {f.category}
                      </span>
                    </span>
                    <Plus
                      size={18}
                      className={`shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-45 text-primary-600" : ""}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-xl pb-1 pt-3 text-sm leading-relaxed text-muted-foreground">
                          {f.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
