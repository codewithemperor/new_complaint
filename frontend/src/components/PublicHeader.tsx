"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X } from "lucide-react";

interface PublicHeaderProps {
  defaultTrackCode?: string;
}

export function PublicHeader({ defaultTrackCode }: PublicHeaderProps = {}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackCode, setTrackCode] = useState("");
  const [trackPasscode, setTrackPasscode] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const trackDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const dialog = trackDialogRef.current;
    if (!dialog) return;
    if (trackOpen && !dialog.open) {
      dialog.showModal();
    } else if (!trackOpen && dialog.open) {
      dialog.close();
    }
  }, [trackOpen]);

  function handleTrackSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = trackCode.trim();
    const passcode = trackPasscode.trim();
    if (code) {
      const params = new URLSearchParams({ code });
      if (passcode) params.set("passcode", passcode);
      window.location.href = `/track?${params.toString()}`;
    }
  }

  const navLinks = [
    { label: "Track", href: "/track" },
    { label: "Report", href: "/report" },
    { label: "FAQ", href: "/#faq" },
    { label: "Contact", href: "/#footer" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-black/5 bg-white/80 shadow-lg shadow-black/[0.03] backdrop-blur-xl"
            : "border-black/5 bg-white/60 backdrop-blur-xl"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold text-neutral-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-lg font-bold text-white shadow-lg shadow-emerald-500/20">
              K
            </span>
            <span className="hidden text-base tracking-tight sm:inline">KwaraMOc Complaints</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                {link.label}
              </Link>
            ))}

            {/* System status indicator */}
            <div className="flex items-center gap-1.5 rounded-full border border-neutral-100 bg-neutral-50 px-2.5 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[10px] font-medium text-neutral-500">Online</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setTrackCode(defaultTrackCode ?? ""); setTrackOpen(true); }}
              className="rounded-full border border-neutral-300 bg-white/50 px-4 py-2 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100"
            >
              Track Complaint
            </button>
            <Link href="/login">
              <button className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700">
                Staff Login
              </button>
            </Link>
            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="flex items-center justify-center rounded-lg p-2 md:hidden">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileOpen && (
          <div className="border-t border-black/5 bg-white/95 backdrop-blur-xl md:hidden">
            <div className="space-y-1 px-6 py-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                >
                  {link.label}
                </Link>
              ))}
              {/* System status on mobile */}
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-medium text-neutral-500">All systems operational</span>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Track modal - native dialog */}
      <dialog
        ref={trackDialogRef}
        onClose={() => setTrackOpen(false)}
        className="w-full max-w-md rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">Track Your Complaint</h2>
            <button
              onClick={() => setTrackOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleTrackSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Ticket Code *</label>
              <input
                value={trackCode}
                onChange={(e) => setTrackCode(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                placeholder="KWMOC-2026-000001"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">6-Digit Passcode</label>
              <input
                value={trackPasscode}
                onChange={(e) => setTrackPasscode(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                placeholder="123456"
                maxLength={6}
                pattern="[0-9]{6}"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Track Status
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
