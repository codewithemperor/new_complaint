"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { ComplaintForm } from "@/components/ComplaintForm";
import { PublicHeader } from "@/components/PublicHeader";
import HeroSection from "@/components/landing/HeroSection";

/* ── Dynamic imports for below-the-fold sections ───────────────── */
const StatsSection = dynamic(() => import("@/components/landing/StatsSection"));
const HowItWorksSection = dynamic(() => import("@/components/landing/HowItWorksSection"));
const TestimonialsSection = dynamic(() => import("@/components/landing/TestimonialsSection"));
const FaqSection = dynamic(() => import("@/components/landing/FaqSection"));
const ContactSection = dynamic(() => import("@/components/landing/ContactSection"));
const FooterSection = dynamic(() => import("@/components/landing/FooterSection"));
const TrackModal = dynamic(() => import("@/components/landing/TrackModal"));

/* ── Main page ─────────────────────────────────────────────────── */
export default function LandingPage() {
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const complaintDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = complaintDialogRef.current;
    if (!dialog) return;
    if (isComplaintOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isComplaintOpen && dialog.open) {
      dialog.close();
    }
  }, [isComplaintOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-neutral-900 antialiased">
      <PublicHeader />

      <HeroSection
        onTrackOpen={() => setIsTrackOpen(true)}
        onComplaintOpen={() => setIsComplaintOpen(true)}
      />

      <StatsSection />

      <HowItWorksSection onComplaintOpen={() => setIsComplaintOpen(true)} />

      <TestimonialsSection />

      <FaqSection onComplaintOpen={() => setIsComplaintOpen(true)} />

      <ContactSection />

      <FooterSection
        onComplaintOpen={() => setIsComplaintOpen(true)}
        onTrackOpen={() => setIsTrackOpen(true)}
      />

      {/* Complaint form modal */}
      <dialog
        ref={complaintDialogRef}
        onClose={() => setIsComplaintOpen(false)}
        className="w-full max-w-lg rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              Submit a complaint
            </h2>
            <button
              onClick={() => setIsComplaintOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X size={18} />
            </button>
          </div>
          <div className="max-h-[75vh] overflow-y-auto">
            <ComplaintForm bare title="" description="" />
          </div>
        </div>
      </dialog>

      {/* Track modal */}
      <TrackModal isOpen={isTrackOpen} onOpenChange={setIsTrackOpen} />
    </div>
  );
}
