/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";

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

type Slot = {
  start: string;
  end: string;
  status: "open" | "held" | "booked";
};

const formatSlot = (slot: Slot) => {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  return `${start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })} · ${start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })} – ${end.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
};

function Booking({ open, onClose, selectedLook }: BookingProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [range] = useState({
    from: new Date().toISOString().slice(0, 10),
    to: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14)
      .toISOString()
      .slice(0, 10),
  });
  // Fetch availability once when modal opens
  useEffect(() => {
    if (!open) return;
    setSlotsLoading(true);
    setSlotError(null);
    const params = new URLSearchParams();
    params.set("from", range.from);
    params.set("to", range.to);
    fetch(`/api/availability?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots || []);
      })
      .catch(() => setSlotError("Unable to load availability."))
      .finally(() => setSlotsLoading(false));
  }, [open, range.from, range.to]);

  const update = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.name || !form.phone) {
      setError("Name and phone are required.");
      return;
    }
    const selectedSlotObj = selectedSlot
      ? slots.find((s) => s.start === selectedSlot)
      : null;
    setSubmitting(true);
    try {
      const body = {
        name: form.name,
        phone: form.phone,
        notes: [form.window, form.notes].filter(Boolean).join(" | "),
        previewUrl: selectedLook
          ? `data:image/png;base64,${selectedLook}`
          : undefined,
        requestedStart: selectedSlotObj?.start,
        requestedEnd: selectedSlotObj?.end,
      };
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send booking.");
      }
      setSent(true);
      setForm(initialForm);
      if (!selectedLook) {
        setError(
          "Booking sent without a preview. Generate a look to attach one next time.",
        );
      }
    } catch (err) {
      setError((err as Error).message || "Failed to send booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSlotSelect = (slot: Slot) => {
    const label = formatSlot(slot);
    setForm((prev) => ({ ...prev, window: label }));
    setSelectedSlot(slot.start);
  };

  const groupedSlots = useMemo(() => {
    const byDay = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
      const key = new Date(slot.start).toDateString();
      acc[key] = acc[key] || [];
      acc[key].push(slot);
      return acc;
    }, {});
    return Object.entries(byDay)
      .sort(
        ([a], [b]) =>
          new Date(a).getTime() - new Date(b).getTime(),
      )
      .map(([day, list]) => ({
        day,
        slots: list.sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
        ),
      }));
  }, [slots]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
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

          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-100">
                Available slots (optional)
              </p>
              {slotsLoading && (
                <p className="text-xs text-neutral-400">Loading slots…</p>
              )}
            </div>
            {slotError && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {slotError}
              </p>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {groupedSlots.map(({ day, slots: daySlots }) => (
                <div
                  key={day}
                  className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-3"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-200">
                    <span>
                      {new Date(day).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-neutral-400">
                      {daySlots.length} slots
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2">
                    {daySlots.map((slot) => (
                      <button
                        key={slot.start}
                        type="button"
                        disabled={slotsLoading}
                        onClick={() => handleSlotSelect(slot)}
                        className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                          selectedSlot === slot.start
                            ? "border-white bg-white/10 text-white"
                            : "border-neutral-700 bg-neutral-900 text-neutral-100 hover:border-neutral-500"
                        }`}
                      >
                        {new Date(slot.start).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        –{" "}
                        {new Date(slot.end).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {!slotsLoading && !slotError && slots.length === 0 && (
                <p className="text-sm text-neutral-400">
                  No slots published yet. Enter your preferred window below.
                </p>
              )}
            </div>
          </div>

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
              disabled={submitting}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-950 shadow-sm transition hover:bg-neutral-100"
            >
              {submitting ? "Sending..." : "Send request"}
            </button>
          </div>
          {error && (
            <p className="md:col-span-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default Booking;
