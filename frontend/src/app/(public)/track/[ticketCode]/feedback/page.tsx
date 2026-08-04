"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { PublicHeader } from "@/components/PublicHeader";

const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";

interface ResolvedTicket {
  ticketCode: string;
  status: string;
  subject: string;
  resolutionText?: string | null;
  resolvedAt?: string | null;
}

/**
 * Citizen feedback page — reached via the feedback link in the TICKET_RESOLVED
 * email. The citizen rates the resolution and either confirms (→ CLOSED) or
 * rejects (→ REOPENED). Token-authenticated, no login required.
 */
export default function FeedbackPage() {
  const params = useParams<{ ticketCode: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [ticket, setTicket] = useState<ResolvedTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [satisfied, setSatisfied] = useState<boolean | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadError(
        "Tracking token is required. Use the link from your resolution email.",
      );
      setLoading(false);
      return;
    }
    api
      .get<ResolvedTicket>(`/tickets/${params.ticketCode}/track?token=${token}`)
      .then((data) => {
        if (data.status !== "RESOLVED") {
          setLoadError(
            data.status === "CLOSED"
              ? "This complaint is already closed."
              : "This complaint is no longer awaiting feedback.",
          );
        } else {
          setTicket(data);
        }
      })
      .catch((err) =>
        setLoadError(
          err instanceof ApiError
            ? err.statusCode === 401
              ? "Invalid or expired tracking link."
              : err.message
            : "Failed to load ticket.",
        ),
      )
      .finally(() => setLoading(false));
  }, [params.ticketCode, token]);

  async function handleSubmit() {
    if (satisfied === null || !token || !ticket) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/tickets/${params.ticketCode}/feedback?token=${token}`, {
        satisfied,
        rating: rating > 0 ? rating : undefined,
        comment: comment.trim() || undefined,
      });
      setDone(
        satisfied
          ? "Thank you — your complaint has been closed."
          : "Thank you — your complaint has been reopened for further investigation.",
      );
    } catch (err) {
      const e = err as ApiError;
      setSubmitError(e.message ?? "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <PublicHeader />
        <p className="text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (loadError || done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 pt-16">
        <PublicHeader />
        <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm">
          <div className="space-y-4 px-6 py-4">
            <p className="text-sm text-neutral-700">{loadError ?? done}</p>
            <Link
              href="/"
              className="block w-full rounded-lg border border-neutral-300 py-2 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-neutral-50 pt-16">
      <PublicHeader />
      <div className="mx-auto w-full max-w-lg py-8">
        <div className="w-full rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm">
          <div className="border-b border-neutral-100 px-6 py-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Resolution Feedback
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              <span className="font-mono">{ticket.ticketCode}</span>
            </p>
          </div>
          <div className="space-y-5 px-6 py-4">
            <div>
              <p className="text-xs font-medium uppercase text-neutral-400">
                Subject
              </p>
              <p className="text-sm font-medium text-neutral-800">
                {ticket.subject}
              </p>
            </div>

            {ticket.resolutionText && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase text-green-600">
                  Resolution
                </p>
                <p className="whitespace-pre-wrap text-sm text-neutral-700">
                  {ticket.resolutionText}
                </p>
              </div>
            )}

            {/* Satisfied? */}
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">
                Are you satisfied with this resolution? *
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSatisfied(true)}
                  className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    satisfied === true
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  ✓ Yes, satisfied
                </button>
                <button
                  type="button"
                  onClick={() => setSatisfied(false)}
                  className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    satisfied === false
                      ? "border-amber-600 bg-amber-50 text-amber-700"
                      : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  ✗ No, not satisfied
                </button>
              </div>
            </div>

            {/* Rating */}
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">
                Rating <span className="text-neutral-400">(optional)</span>
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      star <= rating ? "text-amber-400" : "text-neutral-300"
                    }`}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <p className="mb-1 text-sm font-medium text-neutral-700">
                Comment <span className="text-neutral-400">(optional)</span>
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className={`${inputClass} resize-y`}
                placeholder={
                  satisfied === false
                    ? "Tell us why the resolution was not satisfactory…"
                    : "Additional feedback…"
                }
              />
            </div>

            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <button
              className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 w-full disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={submitting || satisfied === null}
            >
              {submitting ? "Submitting…" : "Submit Feedback"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
