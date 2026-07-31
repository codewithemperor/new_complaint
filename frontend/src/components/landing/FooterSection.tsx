"use client";

import { useState, useCallback, useEffect } from "react";
import { Mail, MapPin, ArrowUp, Shield, Lock } from "lucide-react";

/* ── Social media icons (kept as small SVGs since lucide doesn't have X/LinkedIn brand icons) ── */
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

interface FooterSectionProps {
  onComplaintOpen: () => void;
  onTrackOpen: () => void;
}

const APP_VERSION = "v2.1.0";

export default function FooterSection({ onComplaintOpen, onTrackOpen }: FooterSectionProps) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleNewsletterSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (newsletterEmail.trim()) {
        setNewsletterSubmitted(true);
        setNewsletterEmail("");
        setTimeout(() => setNewsletterSubmitted(false), 4000);
      }
    },
    [newsletterEmail]
  );

  return (
    <>
      <footer id="footer" className="mt-auto bg-[#04130C] text-white">
        {/* Main footer content */}
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-8 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {/* About */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-[#04130C]">
                  K
                </span>
                <span className="font-semibold text-white text-lg">
                  KwaraMOc
                </span>
              </div>
              <p className="text-sm leading-relaxed text-neutral-400">
                The official complaint management and ticketing system for Kwara State. Empowering citizens to voice concerns and track resolution transparently.
              </p>
              {/* Social icons */}
              <div className="mt-6 flex gap-3">
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-neutral-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-400"
                  aria-label="Follow us on X (Twitter)"
                >
                  <TwitterIcon />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-neutral-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-400"
                  aria-label="Connect with us on LinkedIn"
                >
                  <LinkedInIcon />
                </a>
                <a
                  href="mailto:support@kwmoc.gov.ng"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-neutral-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-400"
                  aria-label="Email us at support@kwmoc.gov.ng"
                >
                  <Mail size={18} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
                Quick Links
              </h3>
              <ul className="mt-4 space-y-3">
                {[
                  { label: "Submit a Complaint", action: onComplaintOpen },
                  { label: "Track Status", action: onTrackOpen },
                  { label: "How It Works", href: "#how-it-works" },
                  { label: "FAQ", href: "#faq" },
                ].map((link) => (
                  <li key={link.label}>
                    {link.action ? (
                      <button
                        onClick={link.action}
                        className="text-sm text-neutral-400 transition-colors hover:text-emerald-400"
                        aria-label={link.label}
                      >
                        {link.label}
                      </button>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-neutral-400 transition-colors hover:text-emerald-400"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
                Legal
              </h3>
              <ul className="mt-4 space-y-3">
                {["Privacy Policy", "Terms of Service", "Accessibility", "Data Protection"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-neutral-400 transition-colors hover:text-emerald-400"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Newsletter */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
                Stay Updated
              </h3>
              <p className="mt-4 text-sm text-neutral-400">
                Get updates on new features and improvements.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    aria-label="Email address for newsletter"
                    required
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#04130C] transition-colors hover:bg-emerald-400"
                    aria-label="Subscribe to newsletter"
                  >
                    Subscribe
                  </button>
                </div>
                {newsletterSubmitted && (
                  <p className="mt-2 text-xs text-emerald-400">
                    &#10003; Thank you for subscribing!
                  </p>
                )}
              </form>
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
                  Contact
                </h3>
                <p className="flex items-center gap-2 text-sm text-neutral-400">
                  <Mail size={16} />
                  support@kwmoc.gov.ng
                </p>
                <p className="flex items-center gap-2 text-sm text-neutral-400">
                  <MapPin size={16} />
                  Kwara State Secretariat, Ilorin
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security badge & bottom bar */}
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-500">&copy; {new Date().getFullYear()} Kwara State Government. All rights reserved.</span>
                <span className="text-neutral-600">|</span>
                <span className="text-xs text-neutral-600">{APP_VERSION}</span>
              </div>
              <div className="flex items-center gap-6">
                <a href="#" className="text-sm text-neutral-500 transition-colors hover:text-emerald-400">Privacy</a>
                <a href="#" className="text-sm text-neutral-500 transition-colors hover:text-emerald-400">Terms</a>
                <a href="#" className="text-sm text-neutral-500 transition-colors hover:text-emerald-400">Accessibility</a>
              </div>
            </div>

            {/* Protected by security badge & System Status & Powered by */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 border-t border-white/5 pt-6">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <Shield size={14} className="text-emerald-400" />
                <span className="text-[11px] font-medium text-neutral-400">Protected by</span>
                <Lock size={12} className="text-emerald-400" />
                <span className="text-[11px] font-semibold text-emerald-400">KwaraMOc Security</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px] font-medium text-neutral-400">All Systems Operational</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <span className="text-[11px] font-medium text-neutral-400">Powered by</span>
                <span className="text-[11px] font-semibold text-emerald-400">KwaraMOc</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-all duration-300 hover:bg-emerald-400 hover:shadow-xl ${
          showBackToTop ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        }`}
        aria-label="Back to top"
      >
        <ArrowUp size={18} />
      </button>
    </>
  );
}
