"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Zap,
  Building2,
  Globe,
} from "lucide-react";

/* ── Social media icons ─────────────────────────────────────────── */
function TwitterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/* ── Contact info items ─────────────────────────────────────────── */
const contactItems = [
  {
    icon: Phone,
    label: "Phone",
    value: "+234 800 123 4567",
    href: "tel:+2348001234567",
  },
  {
    icon: Mail,
    label: "Email",
    value: "support@kwmoc.gov.ng",
    href: "mailto:support@kwmoc.gov.ng",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "Kwara State Secretariat, Ibrahim Taiwo Road, Ilorin",
    href: undefined,
  },
  {
    icon: Clock,
    label: "Office Hours",
    value: "Mon–Fri, 8:00 AM – 4:00 PM",
    href: undefined,
  },
];

/* ── Office hours data ─────────────────────────────────────────── */
const officeHours = [
  { day: "Monday", hours: "8:00 AM – 4:00 PM" },
  { day: "Tuesday", hours: "8:00 AM – 4:00 PM" },
  { day: "Wednesday", hours: "8:00 AM – 4:00 PM" },
  { day: "Thursday", hours: "8:00 AM – 4:00 PM" },
  { day: "Friday", hours: "8:00 AM – 4:00 PM" },
  { day: "Saturday", hours: "Closed" },
  { day: "Sunday", hours: "Closed" },
];

/* ── Subject options ────────────────────────────────────────────── */
const subjectOptions = [
  "General Inquiry",
  "Technical Support",
  "Complaint Follow-up",
  "Partnership",
] as const;

/* ── Contact form state ─────────────────────────────────────────── */
interface FormData {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

const initialFormData: FormData = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
};

/* ── Map placeholder illustration ───────────────────────────────── */
function MapPlaceholder() {
  return (
    <div className="relative h-48 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
      {/* Stylized map grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Roads */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-neutral-300" />
      <div className="absolute top-0 bottom-0 left-1/3 w-px bg-neutral-300" />
      <div className="absolute top-0 bottom-0 left-2/3 w-px bg-neutral-300" />
      <div className="absolute top-1/3 left-0 right-0 h-px bg-neutral-300" />
      {/* Location pin */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
            <MapPin size={20} className="text-white" />
          </div>
          <div className="h-3 w-3 -translate-y-1 rotate-45 bg-emerald-500" />
          {/* Pulse ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full border-2 border-emerald-300/30 animate-ping" style={{ animationDuration: "3s" }} />
        </div>
      </div>
      {/* Label */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <span className="rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-neutral-600 shadow-sm backdrop-blur-sm">
          Kwara State Secretariat
        </span>
        <span className="rounded-md bg-emerald-500/90 px-2 py-1 text-[10px] font-medium text-white shadow-sm">
          Ilorin, Kwara State
        </span>
      </div>
    </div>
  );
}

/* ── Contact Section ────────────────────────────────────────────── */
export default function ContactSection() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset after showing success
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData(initialFormData);
    }, 4000);
  };

  return (
    <section
      ref={sectionRef}
      className="bg-neutral-50 py-20 sm:py-28"
      id="contact"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left side — Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Contact
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Get in touch
            </h2>
            <p className="mt-3 max-w-md text-base text-neutral-500">
              Have questions? We&apos;re here to help.
            </p>

            {/* Response Time Badge */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">
              <Zap size={14} className="text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">Average response: 2 hours</span>
            </div>

            {/* Map placeholder */}
            <div className="mt-6">
              <MapPlaceholder />
            </div>

            <div className="mt-6 space-y-4">
              {contactItems.map((item) => {
                const Icon = item.icon;
                const content = (
                  <div className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                      <Icon size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-neutral-700">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );

                return item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block"
                    aria-label={`${item.label}: ${item.value}`}
                  >
                    {content}
                  </a>
                ) : (
                  <div key={item.label}>{content}</div>
                );
              })}
            </div>

            {/* Office Hours */}
            <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-emerald-600" />
                <h4 className="text-sm font-semibold text-neutral-900">Office Hours</h4>
              </div>
              <div className="space-y-1.5">
                {officeHours.map((item) => (
                  <div key={item.day} className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">{item.day}</span>
                    <span className={`font-medium ${item.hours === "Closed" ? "text-neutral-400" : "text-neutral-700"}`}>
                      {item.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media Links */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">Follow us</h4>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                  aria-label="Follow us on X (Twitter)"
                >
                  <TwitterIcon />
                </a>
                <a
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                  aria-label="Connect with us on LinkedIn"
                >
                  <LinkedInIcon />
                </a>
                <a
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                  aria-label="Follow us on Facebook"
                >
                  <FacebookIcon />
                </a>
                <a
                  href="mailto:support@kwmoc.gov.ng"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                  aria-label="Email us"
                >
                  <Mail size={18} />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right side — Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <h3 className="text-lg font-semibold text-neutral-900">
                Send us a message
              </h3>
              <p className="mt-1 text-sm text-neutral-500">
                Fill out the form and we&apos;ll respond within 24 hours.
              </p>

              <div className="mt-6 space-y-5">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="contact-fullName"
                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                  >
                    Full Name
                  </label>
                  <input
                    id="contact-fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                  >
                    Email
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="contact-subject"
                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                  >
                    Subject
                  </label>
                  <select
                    id="contact-subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="" disabled>
                      Select a subject
                    </option>
                    {subjectOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Sending...
                  </>
                ) : isSubmitted ? (
                  <>
                    <CheckCircle2 size={16} />
                    Message sent!
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send message
                  </>
                )}
              </button>

              {/* Success toast */}
              {isSubmitted && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 animate-in fade-in">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <p>
                    Thank you! Your message has been received. We&apos;ll get
                    back to you soon.
                  </p>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
