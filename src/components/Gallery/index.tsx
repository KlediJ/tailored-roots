/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";

type Look = {
  id: string;
  title: string;
  category: "Blonde" | "Brunette" | "Transform" | "Protective";
  description: string;
  accent: string;
};

const looks: Look[] = [
  {
    id: "dimensional-blonde",
    title: "Dimensional Blonde",
    category: "Blonde",
    description: "Soft ribbons of brightness with a shadow root for easy grow-out.",
    accent: "from-amber-200 via-white to-amber-50",
  },
  {
    id: "lived-in-brunette",
    title: "Lived-In Brunette",
    category: "Brunette",
    description: "Seamless brunette with caramel panels and minimal upkeep.",
    accent: "from-stone-700 via-neutral-900 to-stone-800",
  },
  {
    id: "copper-glow",
    title: "Copper Glow",
    category: "Transform",
    description: "High-shine copper with a soft face frame.",
    accent: "from-orange-500 via-amber-300 to-rose-200",
  },
  {
    id: "silver-blend",
    title: "Silver Blend",
    category: "Transform",
    description: "Cool silver melt to soften natural greys and add polish.",
    accent: "from-slate-500 via-slate-200 to-white",
  },
  {
    id: "protective-twist",
    title: "Protective Twist",
    category: "Protective",
    description: "Knotless twists with hydrating prep and scalp care focus.",
    accent: "from-emerald-500 via-emerald-300 to-lime-200",
  },
  {
    id: "silk-press",
    title: "Silk Press",
    category: "Protective",
    description: "Glossy silk press with trim and heat-protective finish.",
    accent: "from-neutral-800 via-neutral-900 to-black",
  },
];

const filters: Array<{ label: string; value: Look["category"] | "All" }> = [
  { label: "All", value: "All" },
  { label: "Blondes", value: "Blonde" },
  { label: "Brunettes", value: "Brunette" },
  { label: "Transformations", value: "Transform" },
  { label: "Protective", value: "Protective" },
];

function Gallery() {
  const [active, setActive] = useState<Look["category"] | "All">("All");

  const visibleLooks = useMemo(() => {
    if (active === "All") return looks;
    return looks.filter((look) => look.category === active);
  }, [active]);

  return (
    <section className="space-y-6 rounded-2xl border border-neutral-200/80 bg-white/90 p-6 shadow-lg backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Lookbook
          </p>
          <h2 className="text-2xl font-semibold text-neutral-900">
            Curated inspiration
          </h2>
          <p className="text-sm text-neutral-600">
            Realistic finishes and maintenance-friendly options to guide your pick.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActive(filter.value)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                active === filter.value
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleLooks.map((look) => (
          <article
            key={look.id}
            className="group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div
              className={`h-40 w-full bg-gradient-to-br ${look.accent} transition group-hover:scale-[1.02]`}
            />
            <div className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-neutral-900">
                  {look.title}
                </h3>
                <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                  {look.category}
                </span>
              </div>
              <p className="text-sm text-neutral-600">{look.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Gallery;
