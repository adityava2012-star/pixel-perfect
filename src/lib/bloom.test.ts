import { describe, it, expect } from "vitest";
import { initialState, toggleMed, endDay, stageOf } from "./bloom";

const takeAll = (s: ReturnType<typeof initialState>) => {
  let r = { state: s, bloomed: false };
  for (const m of s.meds) r = toggleMed(r.state, m.id);
  return r;
};

describe("BloomRoutine rules", () => {
  it("taking all meds counts one perfect day", () => {
    expect(takeAll(initialState()).state.progress).toBe(1);
  });
  it("a missed day wilts but keeps progress", () => {
    let s = takeAll(initialState()).state;
    s = endDay(endDay(s, "d2"), "d3");
    expect(s.wilting).toBe(true);
    expect(s.progress).toBe(1);
  });
  it("taking one med instantly waters a wilting plant", () => {
    const s = endDay(initialState(), "d2");
    expect(toggleMed(s, "m1").state.wilting).toBe(false);
  });
  it("7 perfect days blooms and archives to garden", () => {
    let s = initialState();
    let bloomed = false;
    for (let i = 0; i < 7; i++) {
      const r = takeAll(s);
      bloomed = r.bloomed;
      s = endDay(r.state, `d${i}`);
    }
    expect(bloomed).toBe(true);
    expect(s.garden.length).toBe(1);
    expect(s.plant).toBe(null);
  });
  it("stage names", () => {
    expect([0, 1, 4, 7].map(stageOf)).toEqual(["Seed", "Sprout", "Bud", "Bloom"]);
  });
});
