export type Tier = "bronze" | "rose" | "gold" | "diamond";

export type UnitState = "available" | "locked" | "capstone";

export type Unit = {
  id: string;
  index: string;
  title: string;
  summary: string;
  duration: string;
  tier: Tier;
  lessons: number;
  state: UnitState;
};

export const TIER_GRADIENT: Record<Tier, string> = {
  bronze: "linear-gradient(90deg, #CD7F32 0%, #7a4a1c 100%)",
  rose: "linear-gradient(90deg, #B76E79 0%, #6f3a43 100%)",
  gold: "linear-gradient(90deg, #FFD700 0%, #9a7b00 100%)",
  diamond: "linear-gradient(90deg, #87CEEB 0%, #eaf1f8 100%)",
};

export const TIER_LABEL: Record<Tier, string> = {
  bronze: "Bronze",
  rose: "Rose Gold",
  gold: "Gold",
  diamond: "Diamond",
};

export const UNITS: Unit[] = [
  {
    id: "unit-0",
    index: "00",
    title: "How AI Works",
    summary: "What a model is, and why it sounds confident.",
    duration: "2 min",
    tier: "bronze",
    lessons: 3,
    state: "available",
  },
  {
    id: "unit-1",
    index: "01",
    title: "Benefits of AI",
    summary: "Where AI helps: writing, research, problem solving.",
    duration: "5 min",
    tier: "bronze",
    lessons: 4,
    state: "locked",
  },
  {
    id: "unit-1-5",
    index: "01.5",
    title: "AI Accuracy",
    summary: "Hallucinations, and how to catch one.",
    duration: "6 min",
    tier: "bronze",
    lessons: 2,
    state: "locked",
  },
  {
    id: "unit-2",
    index: "02",
    title: "AI Tools & Techniques",
    summary: "Files, images, and what is safe to upload.",
    duration: "10 min",
    tier: "rose",
    lessons: 3,
    state: "locked",
  },
  {
    id: "unit-3",
    index: "03",
    title: "AI Ethics",
    summary: "Cheating, bias and safety, decided by scenario.",
    duration: "14 min",
    tier: "rose",
    lessons: 3,
    state: "locked",
  },
  {
    id: "unit-4",
    index: "04",
    title: "Building LLMs & Neural Nets",
    summary: "Tokens, attention and training, as puzzles.",
    duration: "18 min",
    tier: "gold",
    lessons: 3,
    state: "locked",
  },
  {
    id: "unit-5",
    index: "05",
    title: "Capstone",
    summary: "Write an AI policy for your own schoolwork.",
    duration: "Open-ended",
    tier: "gold",
    lessons: 1,
    state: "capstone",
  },
];
