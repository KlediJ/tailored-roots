"use client";

import { useState } from "react";
import Link from "next/link";
import Booking from "@/components/Booking";
import Gallery from "@/components/Gallery";
import HairTryOn from "@/components/HairTryOn";

export default function Page() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedLook, setSelectedLook] = useState<string | null>(null);

  const handleBook = (payload: { selfie: string; output: string }) => {
    setSelectedLook(payload.output);
    setBookingOpen(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-neutral-900 to-slate-800 text-white [background-image:radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_35%)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 lg:px-12 space-y-10">
        <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <img
              src="/brand/logo.svg"
              alt="Tailored Roots logo"
              className="h-12 w-auto"
            />
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">
              Preview-first salon experience.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <a
              href="tel:+15551234567"
              className="rounded-full border border-white/20 px-3 py-1 text-white transition hover:border-white/50 hover:bg-white/10"
            >
              (555) 123-4567
            </a>
            <a
              href="https://maps.google.com"
              className="rounded-full border border-white/20 px-3 py-1 text-white transition hover:border-white/50 hover:bg-white/10"
            >
              123 Salon St, Suite 2
            </a>
            <span className="rounded-full border border-white/20 px-3 py-1 text-white/80">
              Hours: Tue–Sat, 10a–6p
            </span>
            <Link
              href="/admin"
              className="rounded-full border border-white/20 px-3 py-1 text-white/80 transition hover:border-white/50 hover:bg-white/10"
            >
              Admin login
            </Link>
          </div>
        </header>

        <section className="grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl sm:grid-cols-2">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">
              Tailored Roots — Hair Studio
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              See the look before the chair.
            </h1>
            <p className="text-base text-neutral-200">
              Upload your inspiration or pick one of ours, add your selfie, and get a
              realistic preview in seconds. Fewer surprises, faster bookings, happier
              appointments.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#tryon"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-200"
              >
                Start your preview
              </a>
              <a
                href="#inspiration"
                className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-white/60 hover:bg-white/10"
              >
                Browse inspiration
              </a>
            </div>
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-100 sm:grid-cols-3">
              {[
                {
                  label: "Precision",
                  text: "Face stays you; only the hair follows the reference.",
                },
                {
                  label: "Fast",
                  text: "Upload, preview, and book in a single flow.",
                },
                {
                  label: "Stylist-ready",
                  text: "Send your preview with the booking so expectations align.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="space-y-1 rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                    {item.label}
                  </p>
                  <p className="text-neutral-50 leading-relaxed">{item.text}</p>
                  <p className="text-neutral-300 text-xs">
                    {item.label === "Precision"
                      ? "Hair shape, length, texture, and color mirror the reference; face/skin/background are preserved."
                      : item.label === "Fast"
                        ? "Takes seconds to upload and preview, so you can decide quickly."
                        : "Your stylist sees the target look before you arrive, reducing revisions."}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black shadow-lg">
            <img
              src="/hero/transformation.jpg"
              alt="Tailored Roots transformation preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-sm text-white">
              <p className="font-semibold">Realistic preview, no surprises.</p>
              <p className="text-neutral-200">
                Upload your selfie, pick a style, and see it before you book.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                What to expect
              </p>
              <p className="text-sm text-neutral-200">
                Your selfie stays yours. Only the hair follows the reference you choose.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-neutral-200 sm:grid-cols-3 sm:gap-4">
              {[
                {
                  label: "Upload",
                  text: "Clear selfie + style reference or a curated look.",
                },
                {
                  label: "Preview",
                  text: "Hair-only change; face/skin/background remain.",
                },
                {
                  label: "Share",
                  text: "Attach your preview when you book.",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                    {item.label}
                  </p>
                  <p className="text-neutral-100">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HairTryOn onBook={handleBook} />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                Ready when you are
              </p>
              <h3 className="text-2xl font-semibold text-white">
                Lock your spot with your chosen look
              </h3>
              <p className="text-sm text-neutral-300">
                We’ll attach your preview and notes so the stylist knows exactly what you want.
              </p>
            </div>
            <button
              onClick={() => setBookingOpen(true)}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-200"
            >
              Open booking
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                Visit Tailored Roots
              </p>
              <h3 className="text-2xl font-semibold text-white">
                Your stylist, fully briefed before you arrive
              </h3>
              <p className="text-sm text-neutral-300">
                Preview your look, attach it to your booking, and show up confident. Call or stop by to finalize details.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-neutral-200">
              <a
                href="tel:+15551234567"
                className="rounded-lg border border-white/20 px-3 py-2 transition hover:border-white/50 hover:bg-white/10"
              >
                Call: (555) 123-4567
              </a>
              <a
                href="https://maps.google.com"
                className="rounded-lg border border-white/20 px-3 py-2 transition hover:border-white/50 hover:bg-white/10"
              >
                123 Salon St, Suite 2 — Get directions
              </a>
              <span className="rounded-lg border border-white/20 px-3 py-2 text-neutral-300">
                Hours: Tue–Sat, 10a–6p
              </span>
            </div>
          </div>
        </section>
      </div>
      <Booking
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        selectedLook={selectedLook}
      />
    </main>
  );
}
