"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface TrackModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TrackModal({ isOpen, onOpenChange }: TrackModalProps) {
  const [trackCode, setTrackCode] = useState("");
  const [trackPasscode, setTrackPasscode] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = trackCode.trim();
    if (c) {
      const p = new URLSearchParams({ code: c });
      if (trackPasscode.trim()) p.set("passcode", trackPasscode.trim());
      window.location.href = `/track?${p.toString()}`;
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      className="w-full max-w-md rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Track Your Complaint
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Ticket Code *
            </label>
            <input
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              placeholder="KWMOC-2026-000001"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              6-Digit Passcode
            </label>
            <input
              value={trackPasscode}
              onChange={(e) => setTrackPasscode(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              placeholder="123456"
              maxLength={6}
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
  );
}
