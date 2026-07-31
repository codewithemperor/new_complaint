"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MessageCircle } from "lucide-react";

/* ── FAQ data with categories ─────────────────────────────────── */
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

const faqCategories = ["All", "General", "Process", "Privacy"] as const;

/* ── Category badge colors ─────────────────────────────────────── */
const categoryColors: Record<string, string> = {
  General: "bg-teal-50 text-teal-700 ring-teal-600/20",
  Process: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Privacy: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

/* ── FAQ accordion item with smooth animation ──────────────────── */
function FaqItem({
  faq,
  isOpen,
  onToggle,
  index,
}: {
  faq: (typeof faqs)[0];
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState("0px");

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setMaxHeight(`${contentRef.current.scrollHeight}px`);
    } else {
      setMaxHeight("0px");
    }
  }, [isOpen]);

  return (
    <div
      className={`border-b border-neutral-200 py-6 transition-colors ${isOpen ? "bg-neutral-50/50 -mx-4 px-4 rounded-xl" : ""}`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${faq.q.replace(/\s/g, "-")}`}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${isOpen ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
            {index + 1}
          </span>
          <span className="text-lg font-semibold text-neutral-900">
            {faq.q}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${categoryColors[faq.category] || "bg-neutral-50 text-neutral-600 ring-neutral-500/20"}`}
          >
            {faq.category}
          </span>
        </div>
        <span
          className={`ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-all duration-300 ${isOpen ? "rotate-45 bg-emerald-100 text-emerald-600" : ""}`}
        >
          +
        </span>
      </button>
      <div
        id={`faq-answer-${faq.q.replace(/\s/g, "-")}`}
        role="region"
        style={{ maxHeight, overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}
      >
        <div ref={contentRef}>
          <p className="max-w-xl pb-2 pt-4 text-base leading-relaxed text-neutral-600 pl-9">
            {faq.a}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── FAQ Section ───────────────────────────────────────────────── */
interface FaqSectionProps {
  onComplaintOpen: () => void;
}

export default function FaqSection({ onComplaintOpen }: FaqSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState("");
  const [faqCategory, setFaqCategory] = useState<string>("All");

  const filteredFaqs = faqs.filter((f) => {
    const matchesSearch =
      faqSearch === "" ||
      f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.a.toLowerCase().includes(faqSearch.toLowerCase());
    const matchesCategory =
      faqCategory === "All" || f.category === faqCategory;
    return matchesSearch && matchesCategory;
  });

  // Count per category
  const categoryCounts: Record<string, number> = {
    All: faqs.length,
    General: faqs.filter((f) => f.category === "General").length,
    Process: faqs.filter((f) => f.category === "Process").length,
    Privacy: faqs.filter((f) => f.category === "Privacy").length,
  };

  return (
    <>
      {/* FAQ */}
      <section id="faq" className="bg-white py-24 sm:py-32">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:flex-row lg:px-8">
          <div className="lg:w-1/3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Support
            </span>
            <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-neutral-500">
              Can&apos;t find what you&apos;re looking for? Reach out to our support team.
            </p>

            {/* Decorative info */}
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <MessageCircle size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{faqs.length} questions answered</p>
                <p className="text-xs text-neutral-500">Browse by category or search below</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col lg:w-2/3">
            {/* Search & filter bar */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search input with gradient border */}
              <div className="relative flex-1">
                <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 opacity-0 transition-opacity focus-within:opacity-100" />
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500"
                    aria-label="Search frequently asked questions"
                  />
                </div>
              </div>
              {/* Category filter tabs with count badges */}
              <div className="flex gap-2 flex-wrap" role="tablist" aria-label="FAQ categories">
                {faqCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFaqCategory(cat)}
                    role="tab"
                    aria-selected={faqCategory === cat}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      faqCategory === cat
                        ? "bg-teal-600 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {cat}
                    <span className={`inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      faqCategory === cat
                        ? "bg-white/20 text-white"
                        : "bg-neutral-200 text-neutral-500"
                    }`}>
                      {categoryCounts[cat]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-neutral-400">
                {filteredFaqs.length} {filteredFaqs.length === 1 ? "result" : "results"}
                {faqSearch && ` for "${faqSearch}"`}
              </p>
            </div>

            {/* FAQ items */}
            {filteredFaqs.length === 0 ? (
              <div className="py-12 text-center">
                <Search size={48} className="mx-auto text-neutral-300" aria-hidden="true" />
                <p className="mt-4 text-sm text-neutral-500">
                  No questions match your search. Try a different term or category.
                </p>
              </div>
            ) : (
              filteredFaqs.map((f, i) => {
                const originalIndex = faqs.indexOf(f);
                return (
                  <FaqItem
                    key={f.q}
                    faq={f}
                    isOpen={openFaq === originalIndex}
                    onToggle={() => setOpenFaq(openFaq === originalIndex ? null : originalIndex)}
                    index={originalIndex}
                  />
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 px-8 py-16 text-center shadow-2xl sm:px-16">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            ></div>
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to make your voice heard?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-emerald-50">
                Submit your complaint now and receive a tracking reference
                instantly. No accounts, no friction.
              </p>
              <div className="mt-10 flex justify-center">
                <button
                  onClick={onComplaintOpen}
                  className="rounded-full bg-white px-8 py-4 text-sm font-bold text-emerald-700 shadow-lg transition-all hover:bg-neutral-50 hover:shadow-xl"
                  aria-label="Submit a complaint now"
                >
                  Submit a complaint &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
