/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";

type Booking = {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  previewUrl?: string;
  status: string;
  createdAt: string;
};

const statuses = ["PENDING", "CONFIRMED", "DECLINED", "DONE"];

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date()),
  );
  const [activeDay, setActiveDay] = useState<Date | null>(null);
  const range = useMemo(() => {
    const fromDate = startOfWeek(currentMonth, { weekStartsOn: 1 });
    const toDate = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return {
      fromDate,
      toDate,
      fromStr: format(fromDate, "yyyy-MM-dd"),
      toStr: format(toDate, "yyyy-MM-dd"),
    };
  }, [currentMonth]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    phone: "",
    start: "",
    end: "",
    notes: "",
    previewUrl: "",
  });
  const [creating, setCreating] = useState(false);
  const [slots, setSlots] = useState<
    { start: string; end: string; status: "open" | "held" | "booked" }[]
  >([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    if (!adminToken) {
      setLoading(false);
      setError("Enter admin token to view bookings.");
      return;
    }
    try {
      const res = await fetch(
        `/api/bookings${statusFilter !== "ALL" ? `?status=${statusFilter}` : ""}`,
        {
          headers: adminToken ? { "x-admin-token": adminToken } : {},
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load bookings.");
      }
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      setError((err as Error).message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, adminToken]);

  useEffect(() => {
    if (!adminToken) return;
    setSlotsLoading(true);
    setSlotsError(null);
    const params = new URLSearchParams();
    params.set("from", range.fromStr);
    params.set("to", range.toStr);
    fetch(`/api/availability?${params.toString()}`, {
      headers: adminToken ? { "x-admin-token": adminToken } : {},
    })
      .then((res) => res.json())
      .then((data) => setSlots(data.slots || []))
      .catch(() => setSlotsError("Failed to load schedule"))
      .finally(() => setSlotsLoading(false));
  }, [adminToken, range.fromStr, range.toStr]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { "x-admin-token": adminToken } : {}),
        },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status.");
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b)),
      );
    } catch (err) {
      setError((err as Error).message || "Failed to update status.");
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    try {
      const res = await fetch(`/api/bookings?id=${id}`, {
        method: "DELETE",
        headers: adminToken ? { "x-admin-token": adminToken } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete booking.");
      }
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError((err as Error).message || "Failed to delete booking.");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("adminToken");
    if (saved) setAdminToken(saved);
  }, []);

  useEffect(() => {
    if (adminToken) {
      localStorage.setItem("adminToken", adminToken);
    }
  }, [adminToken]);

  const calendarDays = useMemo(() => {
    if (!range.fromDate || !range.toDate) return [];
    const start = new Date(range.fromDate);
    const end = new Date(range.toDate);
    const dayMap = slots.reduce<Record<string, typeof slots>>((acc, slot) => {
      const key = new Date(slot.start).toDateString();
      acc[key] = acc[key] || [];
      acc[key].push(slot);
      return acc;
    }, {});

    const days = [];
    for (let d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
      const key = d.toDateString();
      const daySlots = dayMap[key] || [];
      const open = daySlots.filter((s) => s.status !== "booked").length;
      const booked = daySlots.filter((s) => s.status === "booked").length;
      days.push({
        date: new Date(d),
        open,
        booked,
        hasSlots: daySlots.length > 0,
      });
    }
    return days;
  }, [range.fromDate, range.toDate, slots]);

  const selectedDay = useMemo(() => {
    const todayKey = new Date().toDateString();
    const fallback = calendarDays[0]?.date ?? new Date();
    const selected =
      calendarDays.find((d) => d.date.toDateString() === todayKey)?.date ||
      fallback;
    return selected;
  }, [calendarDays]);

  const activeDate = activeDay || selectedDay;
  const activeSlots = useMemo(() => {
    if (!activeDate) return [];
    const key = activeDate.toDateString();
    return slots
      .filter((slot) => new Date(slot.start).toDateString() === key)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [activeDate, slots]);

  return (
    <main className="min-h-screen bg-[#0b0d11] text-white px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-neutral-300">
                Admin Console
              </p>
              <h1 className="text-3xl font-semibold text-white">
                Booking operations
              </h1>
              <p className="text-sm text-neutral-200 max-w-2xl">
                Track inbound requests, confirm or decline quickly, and keep the live calendar aligned with availability.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {["ALL", ...statuses].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                    statusFilter === status
                      ? "border-white bg-white text-neutral-900"
                      : "border-white/20 text-white hover:border-white/50"
                  }`}
                >
                  {status}
                </button>
              ))}
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-full border border-white/60 px-3.5 py-2 text-xs font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                + Add booking
              </button>
              <button
                onClick={fetchBookings}
                className="rounded-full border border-white/30 px-3.5 py-2 text-xs font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                  Admin token
                </p>
                <p className="text-sm text-neutral-200">
                  Required for listing, updating, and deleting.
                </p>
              </div>
              <button
                onClick={() => setAdminToken("")}
                className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold text-white hover:border-white/50"
              >
                Clear
              </button>
            </div>
            <input
              type="password"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
              placeholder="Enter admin token to view/update bookings"
            />
            <p className="text-xs text-neutral-400">
              Stored locally for convenience.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                Live status
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-green-300/40 bg-green-200/10 p-3">
                  <p className="text-xs text-green-100">Confirmed</p>
                  <p className="text-2xl font-semibold text-white">
                    {bookings.filter((b) => b.status === "CONFIRMED").length}
                  </p>
                </div>
                <div className="rounded-xl border border-yellow-300/40 bg-yellow-200/10 p-3">
                  <p className="text-xs text-yellow-100">Pending</p>
                  <p className="text-2xl font-semibold text-white">
                    {bookings.filter((b) => b.status === "PENDING").length}
                  </p>
                </div>
                <div className="rounded-xl border border-blue-300/40 bg-blue-200/10 p-3">
                  <p className="text-xs text-blue-100">Total</p>
                  <p className="text-2xl font-semibold text-white">
                    {bookings.length}
                  </p>
                </div>
                <div className="rounded-xl border border-red-300/40 bg-red-200/10 p-3">
                  <p className="text-xs text-red-100">Declined/Done</p>
                  <p className="text-2xl font-semibold text-white">
                    {
                      bookings.filter(
                        (b) => b.status === "DECLINED" || b.status === "DONE",
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                Actions
              </p>
              <div className="mt-3 grid gap-2 text-sm">
                <button
                  onClick={() => setShowCreate(true)}
                  className="w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2 font-semibold text-white hover:border-white/60"
                >
                  Add manual booking
                </button>
                <button
                  onClick={fetchBookings}
                  className="w-full rounded-lg border border-white/20 px-3 py-2 font-semibold text-white hover:border-white/50"
                >
                  Refresh data
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                Schedule
              </p>
              <p className="text-sm text-neutral-300">
                Open vs booked slots from availability and bookings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/50"
              >
                Prev
              </button>
              <p className="text-sm font-semibold text-white">
                {format(currentMonth, "MMMM yyyy")}
              </p>
              <button
                onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/50"
              >
                Next
              </button>
              {slotsLoading && (
                <p className="text-xs text-neutral-400">Loading schedule…</p>
              )}
            </div>
          </div>
          {slotsError && (
            <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {slotsError}
            </p>
          )}
          {!slotsLoading && !slotsError && (
            <div className="mt-4 space-y-4 text-xs text-neutral-300">
              <div className="grid grid-cols-7 gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                {weekdays.map((day) => (
                  <div key={day} className="text-center font-semibold text-white">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveDay(day.date)}
                    className={`min-h-[90px] cursor-pointer rounded-lg border px-2 py-2 transition ${
                      day.hasSlots
                        ? "border-white/30 bg-white/10 hover:border-white/60"
                        : "border-white/10 bg-black/10 hover:border-white/30"
                    } ${
                      activeDate &&
                      day.date.toDateString() === activeDate.toDateString()
                        ? "ring-2 ring-white/70"
                        : ""
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">
                      {day.date.getDate()}
                    </div>
                    <div className="mt-1 space-y-1">
                      <p className="text-[11px]">
                        Open: {day.open} | Booked: {day.booked}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                <span className="inline-flex items-center gap-1 rounded-full border border-green-200/40 bg-green-200/10 px-2 py-1 text-green-100">
                  ● open
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-red-200/40 bg-red-200/10 px-2 py-1 text-red-100">
                  ● booked
                </span>
              </div>
              {slots.length === 0 && (
                <p className="text-sm text-neutral-300">
                  No slots yet. Publish availability to see the schedule.
                </p>
              )}
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">
                    {activeDate
                      ? activeDate.toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })
                      : "Select a day"}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {activeSlots.length} slot(s)
                  </p>
                </div>
                {activeSlots.length === 0 && (
                  <p className="mt-2 text-sm text-neutral-300">
                    No availability on this day.
                  </p>
                )}
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {activeSlots.map((slot) => (
                    <div
                      key={slot.start}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        slot.status === "booked"
                          ? "border-red-300/50 bg-red-200/10 text-red-100"
                          : "border-green-300/50 bg-green-200/10 text-green-100"
                      }`}
                    >
                      <p className="font-semibold">
                        {new Date(slot.start).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        –{" "}
                        {new Date(slot.end).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs uppercase tracking-[0.12em]">
                        {slot.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {showCreate && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                  Manual booking
                </p>
                <h2 className="text-lg font-semibold text-white">
                  Add an appointment
                </h2>
                <p className="text-sm text-neutral-300">
                  Set a confirmed booking with client details and time.
                </p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/50"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm text-neutral-200">
                Name
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm text-neutral-200">
                Phone
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm text-neutral-200">
                Start (local)
                <input
                  type="datetime-local"
                  value={createForm.start}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm text-neutral-200">
                End (local)
                <input
                  type="datetime-local"
                  value={createForm.end}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm text-neutral-200 sm:col-span-2">
                Notes
                <input
                  type="text"
                  value={createForm.notes}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
                  placeholder="Optional notes"
                />
              </label>
              <label className="space-y-1 text-sm text-neutral-200 sm:col-span-2">
                Preview URL (optional)
                <input
                  type="text"
                  value={createForm.previewUrl}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, previewUrl: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
                  placeholder="https://... or data URL"
                />
              </label>
              <div className="sm:col-span-2 flex items-center justify-between">
                <p className="text-xs text-neutral-400">
                  Creates a CONFIRMED booking with the provided time window.
                </p>
                <button
                  onClick={async () => {
                    if (!createForm.name || !createForm.phone) {
                      setError("Name and phone are required.");
                      return;
                    }
                    if (!createForm.start || !createForm.end) {
                      setError("Start and end time are required.");
                      return;
                    }
                    setCreating(true);
                    setError(null);
                    try {
                      const res = await fetch("/api/bookings", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...(adminToken ? { "x-admin-token": adminToken } : {}),
                        },
                        body: JSON.stringify({
                          name: createForm.name,
                          phone: createForm.phone,
                          notes: createForm.notes,
                          previewUrl: createForm.previewUrl || undefined,
                          requestedStart: createForm.start,
                          requestedEnd: createForm.end,
                          status: "CONFIRMED",
                        }),
                      });
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}));
                        throw new Error(data.error || "Failed to create booking.");
                      }
                      setCreateForm({
                        name: "",
                        phone: "",
                        start: "",
                        end: "",
                        notes: "",
                        previewUrl: "",
                      });
                      setShowCreate(false);
                      fetchBookings();
                    } catch (err) {
                      setError((err as Error).message || "Failed to create booking.");
                    } finally {
                      setCreating(false);
                    }
                  }}
                  className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-100 disabled:opacity-60"
                  disabled={creating}
                >
                  {creating ? "Saving..." : "Save booking"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
          {loading && <p className="text-sm text-neutral-300">Loading…</p>}
          {!loading && bookings.length === 0 && (
            <p className="text-sm text-neutral-300">No bookings yet.</p>
          )}
          {!loading && bookings.length > 0 && (
            <div className="grid gap-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 md:grid-cols-[2fr_1fr]"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-200">
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white">
                        {booking.status}
                      </span>
                      <span className="text-white font-semibold">
                        {booking.name}
                      </span>
                      <span className="text-neutral-300">{booking.phone}</span>
                    </div>
                    <p className="text-sm text-neutral-200">
                      {booking.notes || "No notes"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                      <span>
                        Submitted:{" "}
                        {new Date(booking.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      {booking.previewUrl && (
                        <span className="rounded-full border border-white/20 px-2 py-1 text-[11px] text-white">
                          Preview attached
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {statuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(booking.id, status)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                            booking.status === status
                              ? "border-white bg-white text-neutral-900"
                              : "border-white/20 text-white hover:border-white/50"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                      <button
                        onClick={() => deleteBooking(booking.id)}
                        className="rounded-full border border-red-300/60 px-2.5 py-1 text-xs font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-200/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {booking.previewUrl && (
                    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
                      <img
                        src={booking.previewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
