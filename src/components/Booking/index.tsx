/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

type BookingProps = {
  open: boolean;
  onClose: () => void;
  selectedLook?: string | null;
};

type FormState = {
  name: string;
  phone: string;
  window: string;
  notes: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  window: "",
  notes: "",
};

function Booking({ open, onClose, selectedLook }: BookingProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [sent, setSent] = useState(false);

  const update = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSent(true);
    // In a full build, this would hit a booking endpoint or send an email/SMS.
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              Book the chair
            </p>
            <h3 className="text-2xl font-semibold">Lock in your session</h3>
            <p className="text-sm text-neutral-300">
              We’ll include your preview so the stylist sees your target look.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-neutral-200 hover:border-white/30"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-neutral-100">Name</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-neutral-100">Phone</span>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-neutral-100">
              Preferred time window
            </span>
            <input
              type="text"
              required
              placeholder="e.g., Weekday mornings, or Sat 10a-2p"
              value={form.window}
              onChange={(e) => update("window", e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-neutral-100">
              Notes for your stylist
            </span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Maintenance level, budget, hair history, anything we should know."
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
            />
          </label>

          {selectedLook && (
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                Attached preview
              </p>
              <div className="mt-2 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-3">
                <img
                  src={`data:image/png;base64,${selectedLook}`}
                  alt="Selected look"
                  className="w-full rounded-lg object-cover"
                />
              </div>
            </div>
          )}

          <div className="md:col-span-2 flex items-center justify-between pt-2">
            {sent ? (
              <p className="rounded-full bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-200">
                Request captured. We’ll reach out to confirm.
              </p>
            ) : (
              <p className="text-xs text-neutral-400">
                We’ll route this to the salon booking channel with your preview.
              </p>
            )}
            <button
              type="submit"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-950 shadow-sm transition hover:bg-neutral-100"
            >
              Send request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Booking;
