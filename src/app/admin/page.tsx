"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminHome() {
  const [token, setToken] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("adminToken");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem("adminToken", token);
    } else {
      localStorage.removeItem("adminToken");
    }
  }, [token]);

  const isAuthed = Boolean(token);

  return (
    <main className="min-h-screen bg-[#0b0d11] text-white px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-6 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.24em] text-neutral-300">
            Admin
          </p>
          <h1 className="text-3xl font-semibold text-white">Salon controls</h1>
          <p className="text-sm text-neutral-200">
            Enter the admin token once, then choose what to manage.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg space-y-3">
          <label className="text-xs uppercase tracking-[0.2em] text-neutral-400">
            Admin token
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
            placeholder="Enter admin token"
          />
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
            <span>{isAuthed ? "Token saved locally." : "Token required."}</span>
            {isAuthed && (
              <button
                onClick={() => setToken("")}
                className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-white hover:border-white/50"
              >
                Log out
              </button>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/bookings"
            className={`rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg transition hover:border-white/40 hover:bg-white/10 ${
              !isAuthed ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              Bookings
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Review and update appointments
            </h2>
            <p className="mt-2 text-sm text-neutral-300">
              Confirm, decline, or mark visits done.
            </p>
          </Link>
          <Link
            href="/admin/availability"
            className={`rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg transition hover:border-white/40 hover:bg-white/10 ${
              !isAuthed ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              Availability
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              Set hours and blackouts
            </h2>
            <p className="mt-2 text-sm text-neutral-300">
              Keep the calendar aligned with salon hours.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
