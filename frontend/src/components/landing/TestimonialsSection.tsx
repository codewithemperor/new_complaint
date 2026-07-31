"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Users, Quote, ChevronLeft, ChevronRight } from "lucide-react";

/* ── Testimonial data ───────────────────────────────────────────── */
const testimonials = [
  {
    name: "Amina B.",
    lga: "Ilorin West",
    role: "Community Leader",
    department: "Works Department",
    initials: "AB",
    rating: 5,
    quote:
      "I reported a pothole on my street and got a reference number immediately. Within 2 weeks, the Works Department had fixed it!",
    date: "Jan 2025",
  },
  {
    name: "Ibrahim K.",
    lga: "Offa",
    role: "Business Owner",
    department: "Health Department",
    initials: "IK",
    rating: 5,
    quote:
      "The tracking system gave me peace of mind. I could see exactly where my complaint was in the process.",
    date: "Feb 2025",
  },
  {
    name: "Fatima O.",
    lga: "Omu-Aran",
    role: "Teacher",
    department: "Education Department",
    initials: "FO",
    rating: 4,
    quote:
      "I was skeptical at first, but the system works. My water supply issue was resolved within a month.",
    date: "Dec 2024",
  },
  {
    name: "Lateef A.",
    lga: "Jebba",
    role: "Civil Servant",
    department: "Finance Department",
    initials: "LA",
    rating: 5,
    quote:
      "Finally, a government platform that actually works. The transparency is refreshing.",
    date: "Nov 2024",
  },
  {
    name: "Halima M.",
    lga: "Share",
    role: "Healthcare Worker",
    department: "Health Department",
    initials: "HM",
    rating: 4,
    quote:
      "Submitted a complaint about a blocked drainage. The response was faster than I expected.",
    date: "Jan 2025",
  },
  {
    name: "Yusuf D.",
    lga: "Pategi",
    role: "Farmer",
    department: "Agriculture Department",
    initials: "YD",
    rating: 5,
    quote:
      "The passcode system makes me feel my complaint is secure. Good initiative by the state.",
    date: "Feb 2025",
  },
];

/* ── Star rating component ─────────────────────────────────────── */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-neutral-200 text-neutral-200"
          }
        />
      ))}
    </div>
  );
}

/* ── Testimonial card ──────────────────────────────────────────── */
function TestimonialCard({
  testimonial,
  isVisible,
}: {
  testimonial: (typeof testimonials)[0];
  isVisible: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white p-6 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      {/* Quote icon */}
      <Quote size={28} className="mb-3 text-emerald-200" />

      {/* Rating */}
      <div className="mb-3">
        <StarRating rating={testimonial.rating} />
      </div>

      {/* Quote text */}
      <blockquote className="text-sm leading-relaxed text-neutral-600">
        {testimonial.quote}
      </blockquote>

      {/* Header: avatar + name + LGA */}
      <div className="mt-4 flex items-center gap-3 border-t border-neutral-100 pt-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
          {testimonial.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900">
            {testimonial.name}
          </p>
          <p className="text-xs text-neutral-500">{testimonial.lga}</p>
          <p className="text-[11px] font-medium text-emerald-600">{testimonial.role} · {testimonial.department}</p>
        </div>
      </div>

      {/* Date */}
      <p className="mt-2 text-xs text-neutral-400">{testimonial.date}</p>
    </div>
  );
}

/* ── Carousel Testimonial Card ──────────────────────────────────── */
function CarouselCard({ testimonial }: { testimonial: (typeof testimonials)[0] }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-base font-bold text-emerald-700">
          {testimonial.initials}
        </div>
        <div className="flex-1">
          <Quote size={24} className="mb-2 text-emerald-200" />
          <blockquote className="text-base leading-relaxed text-neutral-700">
            {testimonial.quote}
          </blockquote>
          <div className="mt-4">
            <StarRating rating={testimonial.rating} />
          </div>
          <div className="mt-2">
            <p className="text-sm font-semibold text-neutral-900">{testimonial.name}</p>
            <p className="text-xs text-neutral-500">{testimonial.lga}</p>
            <p className="text-[11px] font-medium text-emerald-600">{testimonial.role} · {testimonial.department}</p>
          </div>
          <p className="mt-1 text-xs text-neutral-400">{testimonial.date}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Testimonials Section ──────────────────────────────────────── */
export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-rotation
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const goNext = useCallback(() => {
    goToSlide((activeIndex + 1) % testimonials.length);
  }, [activeIndex, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide((activeIndex - 1 + testimonials.length) % testimonials.length);
  }, [activeIndex, goToSlide]);

  return (
    <section
      ref={sectionRef}
      className="border-b border-neutral-100 bg-white py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            Testimonials
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            What citizens are saying
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-neutral-500">
            Real feedback from people who used KwaraMOc
          </p>
        </div>

        {/* Carousel - visible on mobile/tablet */}
        <div className="mt-12 md:hidden">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <CarouselCard testimonial={testimonials[activeIndex]} />
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            <button
              onClick={goPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm transition-colors hover:bg-neutral-50"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={16} className="text-neutral-600" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm transition-colors hover:bg-neutral-50"
              aria-label="Next testimonial"
            >
              <ChevronRight size={16} className="text-neutral-600" />
            </button>
          </div>

          {/* Dots indicator */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-6 bg-emerald-500"
                    : "w-2 bg-neutral-300 hover:bg-neutral-400"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Cards grid - visible on desktop */}
        <div className="mt-12 hidden md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <TestimonialCard testimonial={t} isVisible={isVisible} />
            </div>
          ))}
        </div>

        {/* Trust stat */}
        <div className="mt-14 flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-6 py-3">
            <Users size={20} className="text-emerald-600" />
            <p className="text-sm font-medium text-neutral-700">
              Trusted by{" "}
              <span className="font-bold text-emerald-600">2,400+</span>{" "}
              citizens across Kwara State
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
