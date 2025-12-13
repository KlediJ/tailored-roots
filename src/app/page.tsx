"use client";

import { useState } from "react";
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
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10 space-y-12">
        <HairTryOn onBook={handleBook} />
        <Gallery />
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
      </div>
      <Booking
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        selectedLook={selectedLook}
      />
    </main>
  );
}
