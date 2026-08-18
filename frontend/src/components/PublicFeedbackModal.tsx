"use client";

import { useEffect, useState } from "react";
import { Modal } from "@heroui/react";
import { AlertCircle, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type PublicFeedbackModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ticketCode: string;
  token?: string | null;
  passcode?: string | null;
  onSubmitted?: () => void;
};

export function PublicFeedbackModal({
  isOpen,
  onOpenChange,
  ticketCode,
  token,
  passcode,
  onSubmitted,
}: PublicFeedbackModalProps) {
  const [satisfied, setSatisfied] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSatisfied(true);
      setComment("");
      setError(null);
      setDone(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  async function submitFeedback() {
    if (!ticketCode || (!token && !passcode)) {
      setError("Please track this complaint again before submitting feedback.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (passcode) {
        await api.post("/tickets/track/feedback", {
          code: ticketCode,
          passcode,
          satisfied,
          comment: comment.trim() || undefined,
        });
      } else {
        await api.post(
          `/tickets/${encodeURIComponent(ticketCode)}/feedback?token=${encodeURIComponent(token ?? "")}`,
          {
            satisfied,
            comment: comment.trim() || undefined,
          },
        );
      }

      setDone(
        satisfied
          ? "Thank you. Your complaint has been closed."
          : "Thank you. Your complaint has been reopened for further investigation.",
      );
      onSubmitted?.();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to submit feedback. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container placement="center">
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-green-100 text-green-700">
                <MessageSquare size={18} />
              </Modal.Icon>
              <Modal.Heading>Submit Feedback</Modal.Heading>
              <p className="mt-1.5 text-sm leading-5 text-neutral-500">
                Tell us whether the resolution handled your complaint.
              </p>
            </Modal.Header>

            <Modal.Body>
              {done ? (
                <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <span>{done}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Resolution status
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSatisfied(true)}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                          satisfied
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        Resolved
                      </button>
                      <button
                        type="button"
                        onClick={() => setSatisfied(false)}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                          !satisfied
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        Not resolved
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                      Feedback
                    </label>
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      rows={5}
                      className="w-full resize-y rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
                      placeholder={
                        satisfied
                          ? "Share any comment about the resolution..."
                          : "Tell us what was not resolved..."
                      }
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      <AlertCircle size={15} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                {done ? "Close" : "Cancel"}
              </button>
              {!done && (
                <button
                  type="button"
                  onClick={submitFeedback}
                  disabled={submitting || (!satisfied && !comment.trim())}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Submit
                </button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
