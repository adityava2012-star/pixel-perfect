import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plant } from "@/components/Plant";
import {
  PLANTS, DAYS_TO_BLOOM, initialState, toggleMed, endDay, archive, chooseSeed, stageOf, todayKey,
  type BloomState, type PlantType,
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

const KEY = "bloomroutine-v1";
type Tab = "today" | "seeds" | "garden";
const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

function Index() {
  const [state, setState] = useState<BloomState | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [toast, setToast] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(0);
  const [drops, setDrops] = useState<{ id: number; x: number; y: number; dx: number; dy: number }[]>([]);
  const plantRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let s: BloomState;
    try { s = JSON.parse(localStorage.getItem(KEY) || "") as BloomState; } catch { s = initialState(); }
    const today = todayKey();
    if (s.date !== today) s = endDay(s, today);
    setState(s);
  }, []);
  useEffect(() => { if (state) localStorage.setItem(KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); }, [toast]);

  if (!state) return <div className="min-h-dvh bg-background" />;

  const celebrate = (name: string) => {
    setConfetti(Date.now());
    setToast(`🎉 Your ${name} is in full bloom! It's now in your Garden.`);
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

  const plant = state.plant ? PLANTS[state.plant] : null;
  const allTaken = state.meds.every((m) => m.taken);

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
        {([["today", "☀️", "Today"], ["seeds", "🌰", "Choose a Seed"], ["garden", "🏡", "My Garden"]] as const).map(([k, i, l]) => (
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

      <main className="mx-auto mt-6 max-w-3xl px-5">
        {tab === "today" && (
          plant && state.plant ? (
            <div className="space-y-6">
              <section className="rounded-3xl bg-card p-6 text-center shadow-soft">
                <div ref={plantRef} className="flex justify-center">
                  <Plant type={state.plant} progress={state.progress} wilting={state.wilting} />
                </div>
                <h2 className="mt-2 text-2xl font-bold">{plant.name} · {stageOf(state.progress)}</h2>
                <div className="mx-auto mt-3 max-w-md">
                  <div className="h-5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={DAYS_TO_BLOOM} aria-valuenow={state.progress} aria-label="Days of care">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(state.progress / DAYS_TO_BLOOM) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-lg text-muted-foreground">{state.progress} of {DAYS_TO_BLOOM} perfect days</p>
                </div>
              </section>

              <div className={`rounded-2xl border-2 px-5 py-4 text-xl font-bold transition-colors ${state.wilting ? "border-water-strong bg-water text-secondary-foreground" : "border-primary bg-success text-foreground"}`}>
                {state.wilting
                  ? `💧 Your ${plant.name.split(" ").pop()} is thirsty! Log your medicine to water it.`
                  : allTaken ? `🌟 All done for today! Your ${plant.name.split(" ").pop()} is thriving.`
                  : `🌻 Your ${plant.name.split(" ").pop()} is thriving! Keep it up.`}
              </div>

              <section>
                <h2 className="mb-3 text-2xl font-bold">Today's medicine</h2>
                <ul className="space-y-4">
                  {state.meds.map((m) => (
                    <li key={m.id}>
                      <button onClick={(e) => onToggle(m.id, e)} aria-pressed={m.taken}
                        className={`flex min-h-[88px] w-full items-center gap-5 rounded-2xl border-2 p-4 text-left transition-colors focus-visible:outline-4 focus-visible:outline-ring ${m.taken ? "pop border-primary bg-success" : "border-border bg-card hover:bg-muted"}`}>
                        <span className={`flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-xl border-4 text-3xl font-bold ${m.taken ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-background"}`} aria-hidden="true">{m.taken ? "✓" : ""}</span>
                        <span className="flex-1">
                          <span className="block text-lg text-muted-foreground">{m.time}</span>
                          <span className="block text-2xl font-bold">{m.label}</span>
                        </span>
                        <span className="text-lg font-bold text-primary">{m.taken ? "Taken" : "Tap when taken"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            <section className="rounded-3xl bg-card p-8 text-center shadow-soft">
              <p className="text-5xl" aria-hidden="true">🌰</p>
              <h2 className="mt-3 text-3xl font-bold">Time to plant a new seed!</h2>
              <p className="mt-2 text-xl text-muted-foreground">Your last plant is safe in your Garden.</p>
              <button onClick={() => setTab("seeds")} className="mt-6 min-h-[72px] rounded-2xl bg-primary px-8 text-xl font-bold text-primary-foreground shadow-soft">Choose a Seed</button>
            </section>
          )
        )}

        {tab === "seeds" && (
          <section>
            <h2 className="mb-4 text-3xl font-bold">Choose a Seed</h2>
            {state.plant && <p className="mb-4 text-lg text-muted-foreground">Choosing a new seed will replace your current plant and restart its growth.</p>}
            <ul className="grid gap-5 sm:grid-cols-2">
              {(Object.keys(PLANTS) as PlantType[]).map((t) => (
                <li key={t} className="flex flex-col items-center rounded-3xl bg-card p-5 text-center shadow-soft">
                  <Plant type={t} progress={DAYS_TO_BLOOM} wilting={false} size={150} />
                  <h3 className="text-2xl font-bold">{PLANTS[t].name}</h3>
                  <p className="text-lg text-muted-foreground">{PLANTS[t].blurb}</p>
                  <p className="mt-1 text-lg font-bold">🗓️ {PLANTS[t].days} Days of Care to Bloom</p>
                  <button disabled={state.plant === t}
                    onClick={() => { setState(chooseSeed(state, t)); setTab("today"); setToast(`🌱 You planted a ${PLANTS[t].name}!`); }}
                    className="mt-4 min-h-[64px] w-full rounded-2xl bg-primary text-xl font-bold text-primary-foreground disabled:bg-muted disabled:text-muted-foreground">
                    {state.plant === t ? "Currently growing" : "Plant this seed"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === "garden" && (
          <section>
            <h2 className="mb-4 text-3xl font-bold">My Garden</h2>
            {state.garden.length === 0 ? (
              <p className="rounded-3xl bg-card p-8 text-center text-xl text-muted-foreground shadow-soft">Your garden is waiting. Complete 7 perfect days to see your first bloom here.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                {state.garden.map((g) => (
                  <li key={g.id} className="flex flex-col items-center rounded-3xl bg-card p-4 text-center shadow-soft">
                    <Plant type={g.type} progress={DAYS_TO_BLOOM} wilting={false} size={120} />
                    <h3 className="text-xl font-bold">{PLANTS[g.type].name}</h3>
                    <p className="text-lg text-muted-foreground">Bloomed on {fmt(g.bloomedOn)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      <details className="mx-auto mt-16 max-w-3xl px-5 text-muted-foreground">
        <summary className="cursor-pointer text-base">Developer controls</summary>
        <div className="mt-3 flex flex-wrap gap-3">
          <button className="min-h-[60px] rounded-xl border-2 border-border bg-card px-4 text-base font-bold text-foreground"
            onClick={() => setState(endDay({ ...state, meds: state.meds.map((m) => ({ ...m, taken: false })) }, todayKey()))}>Missed Day (Wilt)</button>
          <button className="min-h-[60px] rounded-xl border-2 border-border bg-card px-4 text-base font-bold text-foreground" disabled={!state.plant}
            onClick={() => { const n = state.plant ? PLANTS[state.plant].name : ""; setState(archive({ ...state, progress: DAYS_TO_BLOOM })); celebrate(n); }}>Fast-Forward 7 Days (Bloom)</button>
          <button className="min-h-[60px] rounded-xl border-2 border-border bg-card px-4 text-base font-bold text-foreground"
            onClick={() => setState(endDay(state, todayKey()))}>Next Day</button>
          <button className="min-h-[60px] rounded-xl border-2 border-destructive bg-card px-4 text-base font-bold text-destructive"
            onClick={() => setState(initialState())}>Reset All</button>
        </div>
      </details>
    </div>
  );
}

function Confetti() {
  const colors = ["var(--plant-sunflower)", "var(--plant-rose)", "var(--leaf)", "var(--water-strong)", "var(--plant-lavender)"];
  return (
    <div aria-hidden="true">
      {Array.from({ length: 70 }).map((_, i) => (
        <span key={i} className="confetti" style={{ left: `${Math.random() * 100}vw`, background: colors[i % colors.length], animationDuration: `${2 + Math.random() * 2}s`, animationDelay: `${Math.random() * 0.6}s` }} />
      ))}
    </div>
  );
}
