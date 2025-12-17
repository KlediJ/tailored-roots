/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";

type Rule = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type Blackout = {
  id: string;
  date: string;
  reason?: string | null;
};

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminAvailability() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    dayOfWeek: 1,
    startTime: "10:00",
    endTime: "18:00",
  });
  const [blackoutForm, setBlackoutForm] = useState({
    date: "",
    reason: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rulesRes, blackoutRes] = await Promise.all([
        fetch("/api/availability", {
          headers: token ? { "x-admin-token": token } : {},
        }),
        fetch("/api/availability?blackouts=1", {
          headers: token ? { "x-admin-token": token } : {},
        }),
      ]);

      if (!rulesRes.ok) {
        const data = await rulesRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load rules.");
      }
      const rulesData = await rulesRes.json();
      // rulesData.slots are returned, but we also need raw rules/blackouts
      const rawRules = await fetch("/api/debug/availability-rules", {
        headers: token ? { "x-admin-token": token } : {},
      }).then((r) => r.json()).catch(() => ({ rules: [] }));

      const rawBlackouts = await fetch("/api/debug/blackouts", {
        headers: token ? { "x-admin-token": token } : {},
      }).then((r) => r.json()).catch(() => ({ blackouts: [] }));

      setRules(rawRules.rules || []);
      setBlackouts(rawBlackouts.blackouts || []);
    } catch (err) {
      setError((err as Error).message || "Failed to load availability.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("adminToken");
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem("adminToken", token);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const addRule = async () => {
    setError(null);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-admin-token": token } : {}),
        },
        body: JSON.stringify({ type: "rule", ...form, dayOfWeek: Number(form.dayOfWeek) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add rule.");
      }
      setForm((prev) => ({ ...prev }));
      fetchAll();
    } catch (err) {
      setError((err as Error).message || "Failed to add rule.");
    }
  };

  const addBlackout = async () => {
    setError(null);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-admin-token": token } : {}),
        },
        body: JSON.stringify({ type: "blackout", ...blackoutForm }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add blackout.");
      }
      setBlackoutForm({ date: "", reason: "" });
      fetchAll();
    } catch (err) {
      setError((err as Error).message || "Failed to add blackout.");
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Delete this availability rule?")) return;
    try {
      await fetch(`/api/availability?id=${id}&type=rule`, {
        method: "DELETE",
        headers: token ? { "x-admin-token": token } : {},
      });
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError((err as Error).message || "Failed to delete rule.");
    }
  };

  const deleteBlackout = async (id: string) => {
    if (!confirm("Delete this blackout?")) return;
    try {
      await fetch(`/api/availability?id=${id}&type=blackout`, {
        method: "DELETE",
        headers: token ? { "x-admin-token": token } : {},
      });
      setBlackouts((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError((err as Error).message || "Failed to delete blackout.");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-neutral-900 to-slate-800 text-white px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
              Admin
            </p>
            <h1 className="text-2xl font-semibold text-white">
              Availability & Blackouts
            </h1>
            <p className="text-sm text-neutral-300">
              Publish weekly hours and block out closed dates.
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
          <label className="text-sm text-neutral-200">
            Admin token (from env `ADMIN_TOKEN`)
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full max-w-md rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
            placeholder="Enter admin token to manage availability"
          />
          <p className="text-xs text-neutral-400">
            Token is stored locally for convenience.
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              Add weekly availability
            </h2>
            <div className="grid gap-3">
              <label className="space-y-1 text-sm text-neutral-200">
                Day of week
                <select
                  value={form.dayOfWeek}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dayOfWeek: Number(e.target.value) }))
                  }
                  className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
                >
                  {dayLabels.map((label, idx) => (
                    <option key={label} value={idx}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3 text-sm text-neutral-200">
                <label className="space-y-1">
                  Start time
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
                  />
                </label>
                <label className="space-y-1">
                  End time
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
                  />
                </label>
              </div>
              <button
                onClick={addRule}
                className="w-fit rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-100"
              >
                Add rule
              </button>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Current rules</h3>
              <div className="space-y-2 text-sm text-neutral-200">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <p>
                      {dayLabels[rule.dayOfWeek]} · {rule.startTime}–{rule.endTime}
                    </p>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="rounded-full border border-red-300/60 px-2 py-1 text-xs font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-200/10"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {rules.length === 0 && (
                  <p className="text-neutral-400 text-sm">No rules yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Add blackout date</h2>
            <div className="grid gap-3">
              <label className="space-y-1 text-sm text-neutral-200">
                Date
                <input
                  type="date"
                  value={blackoutForm.date}
                  onChange={(e) =>
                    setBlackoutForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
                />
              </label>
              <label className="space-y-1 text-sm text-neutral-200">
                Reason (optional)
                <input
                  type="text"
                  value={blackoutForm.reason}
                  onChange={(e) =>
                    setBlackoutForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none"
                />
              </label>
              <button
                onClick={addBlackout}
                className="w-fit rounded-lg bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-100"
              >
                Add blackout
              </button>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Blackout dates</h3>
              <div className="space-y-2 text-sm text-neutral-200">
                {blackouts.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <div>
                      <p>{new Date(b.date).toDateString()}</p>
                      {b.reason && (
                        <p className="text-xs text-neutral-400">{b.reason}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteBlackout(b.id)}
                      className="rounded-full border border-red-300/60 px-2 py-1 text-xs font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-200/10"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {blackouts.length === 0 && (
                  <p className="text-neutral-400 text-sm">No blackouts yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
