export type PlantType = "bonsai" | "vine" | "dragonfruit";

export const PLANTS: Record<PlantType, { name: string; short: string; kind: string; days: number; emoji: string; blurb: string }> = {
  bonsai: { name: "Cherry Blossom Bonsai", short: "Bonsai", kind: "Tree", days: 14, emoji: "🌸", blurb: "Slow, patient and magnificent" },
  vine: { name: "White Star Creeper", short: "Creeper", kind: "Vine", days: 3, emoji: "🌿", blurb: "Quick to grow, full of stars" },
  dragonfruit: { name: "Neon Dragon Fruit", short: "Dragon Fruit", kind: "Exotic Succulent", days: 7, emoji: "🌵", blurb: "Bold flowers and bright fruit" },
};

export const GARDEN_SIZE = 16;
export type TimeOfDay = "Morning" | "Afternoon" | "Evening";
export const TIMES: TimeOfDay[] = ["Morning", "Afternoon", "Evening"];
export type MedIconType = "round" | "oval" | "capsule" | "liquid";
export const MED_ICONS: Record<MedIconType, string> = { round: "Round Pill", oval: "Oval Pill", capsule: "Capsule", liquid: "Liquid Drop" };

export interface Med { id: string; name: string; time: TimeOfDay; icon: MedIconType; taken: boolean }
export interface GardenEntry { id: string; type: PlantType; days: number; bloomedOn: string }
export interface BloomState {
  plant: PlantType | null;
  progress: number;
  wilting: boolean;
  todayCounted: boolean;
  date: string;
  meds: Med[];
  garden: (GardenEntry | null)[];
  pending: GardenEntry | null; // bloomed plant waiting to be placed in the garden
  history: string[]; // dates of perfect days
}

export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()));

export const initialState = (date = todayKey()): BloomState => ({
  plant: null,
  progress: 0,
  wilting: false,
  todayCounted: false,
  date,
  meds: [
    { id: "m1", name: "Blood Pressure Pill", time: "Morning", icon: "round", taken: false },
    { id: "m2", name: "Heart Medicine", time: "Afternoon", icon: "capsule", taken: false },
    { id: "m3", name: "Vitamin D", time: "Evening", icon: "oval", taken: false },
  ],
  garden: Array(GARDEN_SIZE).fill(null),
  pending: null,
  history: [],
});

export type StageName = "Seed" | "Sprout" | "Bud" | "Bloom";
export function stageOf(progress: number, days: number): StageName {
  if (progress >= days) return "Bloom";
  if (progress <= 0) return "Seed";
  return progress / days < 0.5 ? "Sprout" : "Bud";
}

export function currentSlot(hour: number): TimeOfDay {
  if (hour < 11) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

/** Current time-of-day first, then the rest in day order. */
export function sortMeds(meds: Med[], hour: number): Med[] {
  const slot = TIMES.indexOf(currentSlot(hour));
  const rank = (t: TimeOfDay) => (TIMES.indexOf(t) - slot + 3) % 3;
  return [...meds].sort((a, b) => rank(a.time) - rank(b.time));
}

/** A missed (non-perfect) day wilts the plant. Never kills it. */
export function endDay(s: BloomState, nextDate: string): BloomState {
  const perfect = s.meds.length > 0 && s.meds.every((m) => m.taken);
  return { ...s, date: nextDate, wilting: perfect ? s.wilting : s.plant ? true : false, todayCounted: false, meds: s.meds.map((m) => ({ ...m, taken: false })) };
}

export function toggleMed(s: BloomState, id: string): { state: BloomState; bloomed: boolean } {
  const meds = s.meds.map((m) => (m.id === id ? { ...m, taken: !m.taken } : m));
  const justTook = meds.find((m) => m.id === id)?.taken ?? false;
  let next: BloomState = { ...s, meds, wilting: justTook ? false : s.wilting };
  if (!s.todayCounted && meds.length > 0 && meds.every((m) => m.taken)) {
    next = { ...next, todayCounted: true, history: [...s.history.filter((d) => d !== s.date), s.date] };
    if (s.plant) next.progress = Math.min(PLANTS[s.plant].days, s.progress + 1);
  }
  if (next.plant && next.progress >= PLANTS[next.plant].days) return { state: bloom(next), bloomed: true };
  return { state: next, bloomed: false };
}

/** Fully bloomed plant moves to "pending", waiting for the user to place it in the garden. */
export function bloom(s: BloomState): BloomState {
  if (!s.plant) return s;
  return { ...s, pending: { id: uid(), type: s.plant, days: PLANTS[s.plant].days, bloomedOn: s.date }, plant: null, progress: 0, wilting: false };
}

export function placePending(s: BloomState, tile: number): BloomState {
  if (!s.pending || tile < 0 || tile >= GARDEN_SIZE || s.garden[tile]) return s;
  const garden = [...s.garden];
  garden[tile] = s.pending;
  return { ...s, garden, pending: null };
}

export function chooseSeed(s: BloomState, type: PlantType): BloomState {
  return { ...s, plant: type, progress: 0, wilting: false };
}

export function upsertMed(s: BloomState, med: Omit<Med, "taken" | "id"> & { id?: string }): BloomState {
  if (med.id && s.meds.some((m) => m.id === med.id)) {
    return { ...s, meds: s.meds.map((m) => (m.id === med.id ? { ...m, name: med.name, time: med.time, icon: med.icon } : m)) };
  }
  return { ...s, meds: [...s.meds, { id: uid(), name: med.name, time: med.time, icon: med.icon, taken: false }] };
}

export function deleteMed(s: BloomState, id: string): BloomState {
  return { ...s, meds: s.meds.filter((m) => m.id !== id) };
}

export function weeklyPerfect(s: BloomState, today = s.date): number {
  const t = new Date(today + "T12:00:00").getTime();
  return s.history.filter((d) => { const diff = (t - new Date(d + "T12:00:00").getTime()) / 86400000; return diff >= 0 && diff < 7; }).length;
}

export function shareMessage(s: BloomState): string {
  const n = weeklyPerfect(s);
  const name = s.plant ? PLANTS[s.plant].name : s.pending ? PLANTS[s.pending.type].name : "garden";
  const grown = s.garden.filter(Boolean).length;
  const routine = n >= 7 ? "completed my medication routine all week" : `completed my medication routine ${n} of the last 7 days`;
  return `Hi! I kept my ${name} healthy and ${routine}! 🌱 My Forever Garden now has ${grown} plant${grown === 1 ? "" : "s"}. — sent from BloomRoutine`;
}
