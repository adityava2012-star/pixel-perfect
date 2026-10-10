export type PlantType = "sunflower" | "rose" | "bonsai" | "lavender";

export const PLANTS: Record<PlantType, { name: string; days: number; petal: string; center: string; blurb: string }> = {
  sunflower: { name: "Robust Sunflower", days: 7, petal: "var(--plant-sunflower)", center: "var(--plant-center)", blurb: "Bright and cheerful" },
  rose: { name: "Classic Red Rose", days: 7, petal: "var(--plant-rose)", center: "var(--plant-rose-dark)", blurb: "Timeless and elegant" },
  bonsai: { name: "Calming Bonsai Tree", days: 7, petal: "var(--plant-blossom)", center: "var(--plant-blossom-dark)", blurb: "Peaceful and wise" },
  lavender: { name: "Gentle Lavender", days: 7, petal: "var(--plant-lavender)", center: "var(--plant-lavender-dark)", blurb: "Soothing and fragrant" },
};

export const DAYS_TO_BLOOM = 7;

export interface Med { id: string; time: string; label: string; taken: boolean }
export interface GardenEntry { id: string; type: PlantType; bloomedOn: string }
export interface BloomState {
  plant: PlantType | null;
  progress: number; // perfect days, 0..7
  wilting: boolean;
  todayCounted: boolean;
  date: string;
  meds: Med[];
  garden: GardenEntry[];
}

export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);

export const initialState = (date = todayKey()): BloomState => ({
  plant: "sunflower",
  progress: 0,
  wilting: false,
  todayCounted: false,
  date,
  meds: [
    { id: "m1", time: "Morning", label: "Blood Pressure Pill", taken: false },
    { id: "m2", time: "Afternoon", label: "Heart Medicine", taken: false },
    { id: "m3", time: "Evening", label: "Vitamin D", taken: false },
  ],
  garden: [],
});

export type StageName = "Seed" | "Sprout" | "Bud" | "Bloom";
export function stageOf(progress: number): StageName {
  if (progress >= DAYS_TO_BLOOM) return "Bloom";
  if (progress >= 4) return "Bud";
  if (progress >= 1) return "Sprout";
  return "Seed";
}

/** Ends the current day: a missed (non-perfect) day wilts the plant. Never kills it. */
export function endDay(s: BloomState, nextDate: string): BloomState {
  const perfect = s.meds.every((m) => m.taken);
  return {
    ...s,
    date: nextDate,
    wilting: perfect ? s.wilting : true,
    todayCounted: false,
    meds: s.meds.map((m) => ({ ...m, taken: false })),
  };
}

/** Taking any medication waters the plant; completing all meds counts a Perfect Day. */
export function toggleMed(s: BloomState, id: string): { state: BloomState; bloomed: boolean } {
  const meds = s.meds.map((m) => (m.id === id ? { ...m, taken: !m.taken } : m));
  const justTook = meds.find((m) => m.id === id)?.taken ?? false;
  let next: BloomState = { ...s, meds, wilting: justTook ? false : s.wilting };
  if (!s.todayCounted && meds.every((m) => m.taken) && s.plant) {
    next = { ...next, todayCounted: true, progress: Math.min(DAYS_TO_BLOOM, s.progress + 1) };
  }
  if (next.plant && next.progress >= DAYS_TO_BLOOM) return { state: archive(next), bloomed: true };
  return { state: next, bloomed: false };
}

export function archive(s: BloomState): BloomState {
  if (!s.plant) return s;
  return {
    ...s,
    garden: [{ id: crypto.randomUUID(), type: s.plant, bloomedOn: s.date }, ...s.garden],
    plant: null,
    progress: 0,
    wilting: false,
  };
}

export function chooseSeed(s: BloomState, type: PlantType): BloomState {
  return { ...s, plant: type, progress: 0, wilting: false };
}
