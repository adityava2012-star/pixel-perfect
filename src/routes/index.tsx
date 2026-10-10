import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plant } from "@/components/Plant";
import {
  PLANTS, GARDEN_SIZE, TIMES, MED_ICONS, initialState, toggleMed, endDay, bloom, chooseSeed, stageOf, todayKey,
  placePending, upsertMed, deleteMed, sortMeds, currentSlot, shareMessage, weeklyPerfect,
  type BloomState, type PlantType, type Med, type MedIconType, type TimeOfDay,
} from "@/lib/bloom";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BloomRoutine — Grow a garden with your daily medicine" },
      { name: "description", content: "A gentle, senior-friendly medication tracker. Take your medicine, water your plant, and grow a beautiful garden." },
      { property: "og:title", content: "BloomRoutine — Grow a garden with your daily medicine" },
      { property: "og:description", content: "A gentle, senior-friendly medication tracker that grows virtual plants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const KEY = "bloomroutine-v2";
type Tab = "today" | "seeds" | "garden";
const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const btn = "min-h-[64px] rounded-2xl px-5 text-xl font-bold focus-visible:outline-4 focus-visible:outline-ring";
const btnPrimary = `${btn} bg-primary text-primary-foreground shadow-soft disabled:bg-muted disabled:text-muted-foreground`;
const btnOutline = `${btn} border-2 border-border bg-card text-foreground hover:bg-muted`;

function load(): BloomState {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "") as BloomState;
    if (!Array.isArray(s.garden) || s.garden.length !== GARDEN_SIZE || !Array.isArray(s.history)) throw new Error();
    return s;
  } catch { return initialState(); }
}

function Index() {
  const [state, setState] = useState<BloomState | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [toast, setToast] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(0);
  const [drops, setDrops] = useState<{ id: number; x: number; y: number; dx: number; dy: number }[]>([]);
  const [manage, setManage] = useState(false);
  const [hour, setHour] = useState(12);
  const plantRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let s = load();
    const today = todayKey();
    if (s.date !== today) s = endDay(s, today);
    setState(s);
    const tick = () => setHour(new Date().getHours());
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (state) localStorage.setItem(KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(null), 4500); return () => clearTimeout(t); }, [toast]);

  if (!state) return <div className="min-h-dvh bg-background" />;

  const celebrate = (name: string) => {
    setConfetti(Date.now());
    setToast(`🎉 Your ${name} is in full bloom! Time to plant it in your Forever Garden.`);
    setTimeout(() => setConfetti(0), 4000);
  };

  const onToggle = (id: string, e: React.MouseEvent) => {
    const med = state.meds.find((m) => m.id === id)!;
    if (!med.taken && plantRef.current) {
      const r = plantRef.current.getBoundingClientRect();
      const drop = { id: Date.now(), x: e.clientX, y: e.clientY, dx: r.left + r.width / 2 - e.clientX, dy: r.top + r.height / 2 - e.clientY };
      setDrops((d) => [...d, drop]);
      setTimeout(() => setDrops((d) => d.filter((x) => x.id !== drop.id)), 1000);
    }
    const name = state.plant ? PLANTS[state.plant].name : "";
    const { state: next, bloomed } = toggleMed(state, id);
    setState(next);
    if (bloomed) celebrate(name);
    else if (!med.taken) setToast(next.todayCounted && !state.todayCounted ? "🌟 Perfect Day! Your plant grew." : "💧 Well done! Your plant has been watered.");
  };

  const share = async () => {
    const msg = shareMessage(state);
    try { await navigator.clipboard.writeText(msg); setToast("💞 Copied! Paste it into a text or email to share."); }
    catch { window.prompt("Copy this message:", msg); }
  };

  const plant = state.plant ? PLANTS[state.plant] : null;
  const allTaken = state.meds.length > 0 && state.meds.every((m) => m.taken);
  const slot = currentSlot(hour);
  const meds = sortMeds(state.meds, hour);

  return (
    <div className="min-h-dvh bg-background pb-40">
      {confetti > 0 && <Confetti key={confetti} />}
      {drops.map((d) => (
        <span key={d.id} className="water-drop" aria-hidden="true" style={{ left: d.x - 16, top: d.y - 16, ["--dx" as string]: `${d.dx}px`, ["--dy" as string]: `${d.dy}px` }}>💧</span>
      ))}

      <header className="mx-auto max-w-3xl px-5 pt-8 pb-4 text-center">
        <h1 className="text-4xl font-bold text-primary">🌱 BloomRoutine</h1>
        <p className="mt-1 text-lg text-muted-foreground">Take your medicine. Grow your garden.</p>
      </header>

      <nav aria-label="Main" className="mx-auto grid max-w-3xl grid-cols-3 gap-3 px-5">
        {([["today", "☀️", "Today"], ["seeds", "🎒", "Seed Catalog"], ["garden", "🏡", "My Garden"]] as const).map(([k, i, l]) => (
          <button key={k} onClick={() => setTab(k)} aria-current={tab === k ? "page" : undefined}
            className={`min-h-[72px] rounded-2xl border-2 px-2 text-lg font-bold transition-colors focus-visible:outline-4 focus-visible:outline-ring ${tab === k ? "border-primary bg-primary text-primary-foreground shadow-soft" : "border-border bg-card text-foreground hover:bg-muted"}`}>
            <span aria-hidden="true">{i}</span> {l}
          </button>
        ))}
      </nav>

      {toast && (
        <div role="status" aria-live="polite" className="banner-in mx-auto mt-5 max-w-3xl px-5">
          <div className="rounded-2xl border-2 border-primary bg-success px-5 py-4 text-xl font-bold text-foreground">{toast}</div>
        </div>
      )}

      <main className="mx-auto mt-6 max-w-3xl space-y-6 px-5">
        {tab === "today" && (
          <>
            {state.pending ? (
              <TimeToPlant state={state} onPlace={(i) => { setState((s) => (s ? placePending(s, i) : s)); setToast("🏡 Planted forever in your garden! Pick a new seed to keep growing."); }} onCatalog={() => setTab("seeds")} />
            ) : plant && state.plant ? (
              <>
                <section className="rounded-3xl bg-card p-6 text-center shadow-soft">
                  <div ref={plantRef} className="flex justify-center">
                    <Plant type={state.plant} progress={state.progress} wilting={state.wilting} />
                  </div>
                  <h2 className="mt-2 text-2xl font-bold">{plant.name} · {stageOf(state.progress, plant.days)}</h2>
                  <div className="mx-auto mt-3 max-w-md">
                    <div className="h-5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={plant.days} aria-valuenow={state.progress} aria-label="Days of care">
                      <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(state.progress / plant.days) * 100}%` }} />
                    </div>
                    <p className="mt-2 text-lg text-muted-foreground">{state.progress} of {plant.days} perfect days</p>
                  </div>
                </section>
                <div className={`rounded-2xl border-2 px-5 py-4 text-xl font-bold transition-colors ${state.wilting ? "border-water-strong bg-water text-secondary-foreground" : "border-primary bg-success text-foreground"}`}>
                  {state.wilting
                    ? "💧 Your plant is thirsty! Take your medicine to water it back to health."
                    : allTaken ? `🌟 All done for today! Your ${plant.short} is thriving.`
                    : `${plant.emoji} Your ${plant.short} is thriving! Keep it up.`}
                </div>
              </>
            ) : (
              <section className="rounded-3xl bg-card p-8 text-center shadow-soft">
                <p className="text-5xl" aria-hidden="true">🌰</p>
                <h2 className="mt-3 text-3xl font-bold">Time to plant a seed!</h2>
                <p className="mt-2 text-xl text-muted-foreground">Pick a plant from the Seed Catalog to start growing.</p>
                <button onClick={() => setTab("seeds")} className={`mt-6 ${btnPrimary}`}>🎒 Open Seed Catalog</button>
              </section>
            )}

            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">Today's medicine</h2>
                <button onClick={() => setManage(true)} className={btnOutline}>⚙️ Manage Medications</button>
              </div>
              {meds.length === 0 ? (
                <p className="rounded-2xl bg-card p-6 text-xl text-muted-foreground shadow-soft">No medications yet. Tap "⚙️ Manage Medications" to add one.</p>
              ) : (
                <ul className="space-y-4">
                  {meds.map((m) => {
                    const now = m.time === slot;
                    return (
                      <li key={m.id}>
                        {now && !m.taken && <p className="mb-1 text-lg font-bold text-primary">⏰ Take now · {m.time}</p>}
                        <button onClick={(e) => onToggle(m.id, e)} aria-pressed={m.taken}
                          className={`flex min-h-[88px] w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors focus-visible:outline-4 focus-visible:outline-ring ${m.taken ? "pop border-2 border-primary bg-success" : now ? "border-4 border-plant-sunflower bg-card shadow-soft" : "border-2 border-border bg-card opacity-90 hover:bg-muted"}`}>
                          <span className={`flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-xl border-4 text-3xl font-bold ${m.taken ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-background"}`} aria-hidden="true">{m.taken ? "✓" : ""}</span>
                          <MedIcon icon={m.icon} />
                          <span className="flex-1">
                            <span className="block text-lg text-muted-foreground">{m.time}</span>
                            <span className="block text-2xl font-bold">{m.name}</span>
                          </span>
                          <span className="text-lg font-bold text-primary">{m.taken ? "Taken" : "Tap when taken"}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}

        {tab === "seeds" && (
          <section>
            <h2 className="mb-2 text-3xl font-bold">🎒 Seed Catalog</h2>
            {state.plant && <p className="mb-4 text-lg text-muted-foreground">Choosing a new seed will replace your current plant and restart its growth.</p>}
            {state.pending && <p className="mb-4 text-lg font-bold text-primary">Plant your bloomed {PLANTS[state.pending.type].short} in your garden first (on the Today screen).</p>}
            <ul className="grid gap-5 sm:grid-cols-3">
              {(Object.keys(PLANTS) as PlantType[]).map((t) => (
                <li key={t} className="flex flex-col items-center rounded-3xl bg-card p-5 text-center shadow-soft">
                  <Plant type={t} progress={PLANTS[t].days} wilting={false} size={140} />
                  <h3 className="text-2xl font-bold">{PLANTS[t].emoji} {PLANTS[t].name}</h3>
                  <p className="text-lg text-muted-foreground">Type: {PLANTS[t].kind}</p>
                  <p className="text-lg text-muted-foreground">{PLANTS[t].blurb}</p>
                  <p className="mt-1 text-lg font-bold">🗓️ Takes {PLANTS[t].days} perfect days to reach maturity</p>
                  <button disabled={state.plant === t || !!state.pending}
                    onClick={() => { setState(chooseSeed(state, t)); setTab("today"); setToast(`🌱 You planted a ${PLANTS[t].name}!`); }}
                    className={`mt-auto w-full ${btnPrimary} mt-4`}>
                    {state.plant === t ? "Currently growing" : "🌱 Plant this seed"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === "garden" && (
          <section>
            <h2 className="mb-2 text-3xl font-bold">🏡 My Forever Garden</h2>
            <p className="mb-4 text-lg text-muted-foreground">Tap a plant to see its story.</p>
            <GardenGrid garden={state.garden} />
          </section>
        )}

        <section className="rounded-3xl border-2 border-border bg-card p-5 shadow-soft">
          <h2 className="text-2xl font-bold">💞 Share My Progress</h2>
          <p className="mt-1 text-lg text-muted-foreground">{weeklyPerfect(state)} of the last 7 days complete. Send a friendly update to family or your doctor.</p>
          <button onClick={share} className={`mt-3 w-full ${btnPrimary}`}>💞 Copy My Progress Message</button>
        </section>
      </main>

      {manage && <ManageMeds meds={state.meds} onClose={() => setManage(false)}
        onSave={(m) => setState(upsertMed(state, m))} onDelete={(id) => setState(deleteMed(state, id))} />}

      <details className="mx-auto mt-16 max-w-3xl px-5 text-muted-foreground">
        <summary className="cursor-pointer text-base">Developer controls</summary>
        <div className="mt-3 flex flex-wrap gap-3">
          <button className="min-h-[60px] rounded-xl border-2 border-border bg-card px-4 text-base font-bold text-foreground"
            onClick={() => setState(endDay({ ...state, meds: state.meds.map((m) => ({ ...m, taken: false })) }, todayKey()))}>💧 Missed Day (Wilt)</button>
          <button className="min-h-[60px] rounded-xl border-2 border-border bg-card px-4 text-base font-bold text-foreground" disabled={!state.plant}
            onClick={() => { const n = state.plant ? PLANTS[state.plant].name : ""; setState(bloom(state)); setTab("today"); celebrate(n); }}>⏩ Fast-Forward (Bloom)</button>
          <button className="min-h-[60px] rounded-xl border-2 border-border bg-card px-4 text-base font-bold text-foreground"
            onClick={() => setState(endDay(state, todayKey()))}>📅 Next Day</button>
          <button className="min-h-[60px] rounded-xl border-2 border-destructive bg-card px-4 text-base font-bold text-destructive"
            onClick={() => setState(initialState())}>🔄 Reset All</button>
        </div>
      </details>
    </div>
  );
}

// How long the planting jiggle + petal burst plays before the plant is committed to the garden.
const LANDING_MS = 1300;

function TimeToPlant({ state, onPlace, onCatalog }: { state: BloomState; onPlace: (i: number) => void; onCatalog: () => void }) {
  const [picked, setPicked] = useState(false);
  const [landing, setLanding] = useState<{ index: number; type: PlantType; days: number } | null>(null);
  const p = state.pending!;
  const full = state.garden.every(Boolean);

  // Let the plant visibly settle into its tile before the planting screen gives way to the next step.
  const place = (i: number) => {
    if (landing) return;
    setLanding({ index: i, type: p.type, days: p.days });
    setPicked(false);
    setTimeout(() => onPlace(i), LANDING_MS);
  };

  return (
    <section className="banner-in space-y-4 rounded-3xl bg-card p-6 text-center shadow-soft">
      <h2 className="text-3xl font-bold">🎉 Time to Plant!</h2>
      <p className="text-xl text-muted-foreground" role="status" aria-live="polite">
        {landing ? `Planting your ${PLANTS[p.type].name}…` : picked ? "Now tap an empty grass tile below." : `Tap your ${PLANTS[p.type].name}, then tap an empty spot in your garden.`}
      </p>
      <button onClick={() => setPicked(!picked)} aria-pressed={picked} disabled={!!landing}
        className={`mx-auto flex flex-col items-center rounded-3xl border-4 p-3 transition-opacity ${landing ? "border-border opacity-50" : picked ? "glow border-plant-sunflower" : "border-primary"}`}>
        <Plant type={p.type} progress={p.days} wilting={false} size={160} />
        <span className="text-xl font-bold">{landing ? "🌱 Planting…" : picked ? "✋ Selected" : "👆 Tap to pick up"}</span>
      </button>
      {full && <p className="text-lg font-bold text-destructive">Your garden is full! Ask a helper to make room.</p>}
      <GardenGrid garden={state.garden} placing={picked && !landing} onPlace={place} landing={landing} />
      <button onClick={onCatalog} className={btnOutline}>🎒 View Seed Catalog</button>
    </section>
  );
}

const PETAL_COLORS = ["var(--plant-blossom-mid)", "var(--plant-blossom)", "var(--plant-sunflower)", "var(--leaf)", "var(--plant-lavender)", "var(--leaf-dark)"];

/** A burst of petals and leaves that flies out from the tile a plant just landed in. */
function PetalBurst() {
  const [bits] = useState(() => Array.from({ length: 18 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.5;
    const dist = 55 + Math.random() * 55;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 30,
      rot: Math.round((Math.random() - 0.5) * 720),
      delay: 0.25 + Math.random() * 0.15,
      color: PETAL_COLORS[i % PETAL_COLORS.length],
      leafy: i % 3 === 0,
    };
  }));
  return (
    <span aria-hidden="true">
      {bits.map((b, i) => (
        <span key={i} className={`petal ${b.leafy ? "leafy" : ""}`}
          style={{ ["--dx" as string]: `${b.dx}px`, ["--dy" as string]: `${b.dy}px`, ["--rot" as string]: `${b.rot}deg`, ["--c" as string]: b.leafy ? "var(--leaf)" : b.color, ["--d" as string]: `${b.delay}s` }} />
      ))}
    </span>
  );
}

function GardenGrid({ garden, placing = false, onPlace, landing = null }: { garden: BloomState["garden"]; placing?: boolean; onPlace?: (i: number) => void; landing?: { index: number; type: PlantType; days: number } | null }) {
  const [info, setInfo] = useState<number | null>(null);
  return (
    <div className="garden-scene">
      <div className="garden-sky" aria-hidden="true">
        <span className="garden-tree" style={{ left: "-3%", width: 92, height: 92 }} />
        <span className="garden-tree blossom" style={{ left: "18%", width: 70, height: 70, bottom: 30 }} />
        <span className="garden-tree" style={{ left: "40%", width: 100, height: 100, bottom: 20 }} />
        <span className="garden-tree" style={{ left: "66%", width: 78, height: 78, bottom: 28 }} />
        <span className="garden-tree blossom" style={{ left: "86%", width: 84, height: 84 }} />
        <span className="garden-hedge" />
      </div>
      <div className="garden-fence" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => <span key={i} className="garden-picket" />)}
      </div>
      <div className="garden-patio">
        <span className="garden-critter garden-butterfly" style={{ right: 10, top: 6 }} aria-hidden="true">🦋</span>
        <ul className="garden-bed grid grid-cols-4 gap-2 sm:gap-3" aria-label="Forever Garden, 4 by 4 plot">
          {garden.map((g, i) => {
            const isLanding = landing?.index === i;
            const entry = g ?? (isLanding && landing ? { type: landing.type, days: landing.days } : null);
            const sway = { ["--breeze-delay" as string]: `${(i * 1.7) % 6}s`, ["--breeze-dur" as string]: `${6 + (i % 4)}s` };
            return (
              <li key={g?.id ?? `empty-${i}`} className="group relative">
                {g ? (
                  <button onClick={() => setInfo(info === i ? null : i)} aria-label={`${PLANTS[g.type].name}. Grown over ${g.days} days, finished on ${fmt(g.bloomedOn)}`}
                    style={sway} className="garden-tile is-planted flex aspect-square min-h-[64px] w-full items-end justify-center">
                    <span className="pot-shadow" aria-hidden="true" />
                    <span className="plant-wrap"><Plant type={g.type} progress={g.days} wilting={false} size={70} /></span>
                  </button>
                ) : entry ? (
                  <>
                    <button disabled aria-label={`Planting your ${PLANTS[entry.type].name} in spot ${i + 1}`}
                      style={sway} className="garden-tile is-planted flex aspect-square min-h-[64px] w-full items-end justify-center">
                      <span className="pot-shadow" aria-hidden="true" />
                      <span className="plant-wrap plant-jiggle"><Plant type={entry.type} progress={entry.days} wilting={false} size={70} /></span>
                    </button>
                    <PetalBurst />
                  </>
                ) : (
                  <button disabled={!placing} onClick={() => onPlace?.(i)} aria-label={placing ? `Plant here, spot ${i + 1}` : `Empty spot ${i + 1}`}
                    className={`garden-tile is-empty flex aspect-square min-h-[64px] w-full items-center justify-center ${placing ? "is-placing" : ""}`}>
                    {placing && <span className="garden-tile-label">🌱 Plant here</span>}
                  </button>
                )}
                {g && (
                  <span role="tooltip" className={`absolute left-1/2 top-full z-20 mt-1 w-48 -translate-x-1/2 rounded-xl border-2 border-primary bg-card p-2 text-center text-base font-bold text-foreground shadow-soft ${info === i ? "block" : "hidden group-hover:block"}`}>
                    {PLANTS[g.type].emoji} Grown over {g.days} days, finished on {fmt(g.bloomedOn)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="garden-wall" aria-hidden="true">
        <span className="garden-wall-row" />
        <span className="garden-wall-row offset" />
      </div>
    </div>
  );
}

function MedIcon({ icon, size = 44 }: { icon: MedIconType; size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" className="shrink-0">
      {icon === "round" && <><circle cx="20" cy="20" r="14" fill="var(--card)" stroke="var(--foreground)" strokeWidth="3" /><line x1="10" y1="20" x2="30" y2="20" stroke="var(--foreground)" strokeWidth="2" /></>}
      {icon === "oval" && <ellipse cx="20" cy="20" rx="16" ry="10" fill="var(--plant-sunflower)" stroke="var(--foreground)" strokeWidth="3" />}
      {icon === "capsule" && <g transform="rotate(-35 20 20)"><path d="M20 12 h-6 a8 8 0 0 0 0 16 h6 Z" fill="var(--plant-rose)" stroke="var(--foreground)" strokeWidth="3" /><path d="M20 12 h6 a8 8 0 0 1 0 16 h-6 Z" fill="var(--card)" stroke="var(--foreground)" strokeWidth="3" /></g>}
      {icon === "liquid" && <path d="M20 5 C12 17 9 22 9 26 a11 11 0 0 0 22 0 c0 -4 -3 -9 -11 -21Z" fill="var(--water-strong)" stroke="var(--foreground)" strokeWidth="3" />}
    </svg>
  );
}

function ManageMeds({ meds, onClose, onSave, onDelete }: { meds: Med[]; onClose: () => void; onSave: (m: { id?: string; name: string; time: TimeOfDay; icon: MedIconType }) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState<{ id?: string; name: string; time: TimeOfDay; icon: MedIconType } | null>(null);
  const [error, setError] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);

  const save = () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) return setError("Please type a medication name.");
    if (name.length > 60) return setError("Please keep the name under 60 letters.");
    onSave({ ...editing, name }); setEditing(null); setError("");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/50 p-3 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="mm-title" onClick={(e) => e.stopPropagation()}
        className="banner-in max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="mm-title" className="text-3xl font-bold">⚙️ Manage Medications</h2>
          <button onClick={onClose} className={btnOutline}>✖️ Close</button>
        </div>

        {editing ? (
          <div className="space-y-5">
            <label className="block">
              <span className="text-xl font-bold">Medication name</span>
              <input autoFocus value={editing.name} maxLength={60} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g. Blood Pressure" className="mt-2 min-h-[64px] w-full rounded-2xl border-2 border-input bg-background px-4 text-xl" />
            </label>
            <fieldset>
              <legend className="text-xl font-bold">Time of day</legend>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {TIMES.map((t) => (
                  <button key={t} onClick={() => setEditing({ ...editing, time: t })} aria-pressed={editing.time === t}
                    className={`${btn} border-2 ${editing.time === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                    {t === "Morning" ? "🌅" : t === "Afternoon" ? "☀️" : "🌙"} {t}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-xl font-bold">Icon</legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(Object.keys(MED_ICONS) as MedIconType[]).map((ic) => (
                  <button key={ic} onClick={() => setEditing({ ...editing, icon: ic })} aria-pressed={editing.icon === ic}
                    className={`${btn} flex items-center gap-3 border-2 ${editing.icon === ic ? "border-primary bg-success" : "border-border bg-background"}`}>
                    <MedIcon icon={ic} size={36} /> {MED_ICONS[ic]}
                  </button>
                ))}
              </div>
            </fieldset>
            {error && <p role="alert" className="text-xl font-bold text-destructive">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setEditing(null); setError(""); }} className={btnOutline}>↩️ Cancel</button>
              <button onClick={save} className={btnPrimary}>💾 Save Medication</button>
            </div>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {meds.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-border p-3">
                  <MedIcon icon={m.icon} />
                  <span className="flex-1"><span className="block text-lg text-muted-foreground">{m.time}</span><span className="block text-xl font-bold">{m.name}</span></span>
                  {confirmDel === m.id ? (
                    <>
                      <button onClick={() => setConfirmDel(null)} className={btnOutline}>↩️ Keep</button>
                      <button onClick={() => { onDelete(m.id); setConfirmDel(null); }} className={`${btn} bg-destructive text-destructive-foreground`}>🗑️ Yes, Delete</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditing({ id: m.id, name: m.name, time: m.time, icon: m.icon })} className={btnOutline}>✏️ Edit</button>
                      <button onClick={() => setConfirmDel(m.id)} className={`${btn} border-2 border-destructive bg-card text-destructive`}>🗑️ Delete Medication</button>
                    </>
                  )}
                </li>
              ))}
              {meds.length === 0 && <p className="text-xl text-muted-foreground">No medications yet.</p>}
            </ul>
            <button onClick={() => setEditing({ name: "", time: "Morning", icon: "round" })} className={`mt-5 w-full ${btnPrimary}`}>➕ Add Medication</button>
          </>
        )}
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ["var(--plant-sunflower)", "var(--plant-blossom-mid)", "var(--leaf)", "var(--water-strong)", "var(--dragon)"];
  return (
    <div aria-hidden="true">
      {Array.from({ length: 70 }).map((_, i) => (
        <span key={i} className="confetti" style={{ left: `${Math.random() * 100}vw`, background: colors[i % colors.length], animationDuration: `${2 + Math.random() * 2}s`, animationDelay: `${Math.random() * 0.6}s` }} />
      ))}
    </div>
  );
}
