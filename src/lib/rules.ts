export type RecommendedService = {
  title: string;
  duration: string;
  maintenance: "Low" | "Medium" | "High";
  notes: string;
};

type Rule = {
  keywords: string[];
  services: RecommendedService[];
};

const rules: Rule[] = [
  {
    keywords: ["blonde", "highlight", "bright", "foil"],
    services: [
      {
        title: "Dimensional blonding",
        duration: "3-3.5 hrs",
        maintenance: "Medium",
        notes: "Foils + root melt for softer grow out.",
      },
      {
        title: "Gloss + cut",
        duration: "1.5 hrs",
        maintenance: "Low",
        notes: "Tone refresh and shape-up between blonding visits.",
      },
    ],
  },
  {
    keywords: ["brunette", "brown", "balayage", "caramel"],
    services: [
      {
        title: "Lived-in balayage",
        duration: "2.5 hrs",
        maintenance: "Low",
        notes: "Hand-painted lift with root shadow for longevity.",
      },
      {
        title: "Gloss + trim",
        duration: "1.5 hrs",
        maintenance: "Low",
        notes: "Tone and tidy every 8-10 weeks.",
      },
    ],
  },
  {
    keywords: ["copper", "red", "warm"],
    services: [
      {
        title: "Copper refresh",
        duration: "2 hrs",
        maintenance: "Medium",
        notes: "All-over color with shine treatment.",
      },
    ],
  },
  {
    keywords: ["protective", "twist", "braid", "knotless", "silk press"],
    services: [
      {
        title: "Protective styling consult",
        duration: "30 mins",
        maintenance: "Low",
        notes: "Hair/scalp prep plan and style selection.",
      },
      {
        title: "Protective style install",
        duration: "3-4 hrs",
        maintenance: "Low",
        notes: "Hydrating prep, knotless / twists with tension control.",
      },
    ],
  },
  {
    keywords: ["silver", "grey", "gray", "platinum"],
    services: [
      {
        title: "Grey blending",
        duration: "2.5 hrs",
        maintenance: "Medium",
        notes: "Foils + lowlights to soften demarcation.",
      },
    ],
  },
];

export function getRecommendations(description: string): RecommendedService[] {
  const lower = description.toLowerCase();
  const matches = rules.find((rule) =>
    rule.keywords.some((keyword) => lower.includes(keyword)),
  );
  return matches ? matches.services : [];
}
