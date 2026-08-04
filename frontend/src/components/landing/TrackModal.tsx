"use client";

import { useState } from "react";
import { Modal } from "@heroui/react";
import { Search } from "lucide-react";

interface TrackModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TrackModal({ isOpen, onOpenChange }: TrackModalProps) {
  const [trackCode, setTrackCode] = useState("");
  const [trackPasscode, setTrackPasscode] = useState("");

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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon>
                <Search size={18} className="text-primary-600" />
              </Modal.Icon>
              <Modal.Heading>Track your complaint</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              <form
                id="track-form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Ticket code *
                  </label>
                  <input
                    value={trackCode}
                    onChange={(e) => setTrackCode(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="KWMOC-2026-000001"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    6-digit passcode
                  </label>
                  <input
                    value={trackPasscode}
                    onChange={(e) => setTrackPasscode(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              </form>
            </Modal.Body>

            <Modal.Footer>
              {/* Solid primary-600, independent of the light/dark accent token */}
              <button
                type="submit"
                form="track-form"
                className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Track status
              </button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
