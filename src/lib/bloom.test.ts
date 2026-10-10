import { describe, it, expect } from "vitest";
import { initialState, toggleMed, endDay, stageOf, chooseSeed, placePending, sortMeds, PLANTS, type BloomState } from "./bloom";

const takeAll = (s: BloomState) => {
  let r = { state: s, bloomed: false };
  for (const m of s.meds) r = toggleMed(r.state, m.id);
  return r;
};
const grow = (type: "bonsai" | "vine" | "dragonfruit", days: number) => {
  let s = chooseSeed(initialState("2026-01-01"), type);
  let bloomed = false;
  for (let i = 0; i < days; i++) { const r = takeAll(s); bloomed = r.bloomed; s = endDay(r.state, `2026-01-${String(i + 2).padStart(2, "0")}`); }
  return { s, bloomed };
};

describe("BloomRoutine rules", () => {
  it("growth times: bonsai 14, vine 3, dragon fruit 7", () => {
    expect([PLANTS.bonsai.days, PLANTS.vine.days, PLANTS.dragonfruit.days]).toEqual([14, 3, 7]);
  });
  it("vine blooms after 3 perfect days, bonsai not yet", () => {
    expect(grow("vine", 3).bloomed).toBe(true);
    expect(grow("bonsai", 3).s.plant).toBe("bonsai");
  });
  it("bonsai blooms after 14 perfect days", () => {
    const { s, bloomed } = grow("bonsai", 14);
    expect(bloomed).toBe(true);
    expect(s.pending?.type).toBe("bonsai");
  });
  it("a missed day wilts but keeps progress; taking a med restores", () => {
    let s = takeAll(chooseSeed(initialState(), "bonsai")).state;
    s = endDay(endDay(s, "d2"), "d3");
    expect(s.wilting).toBe(true);
    expect(s.progress).toBe(1);
    expect(toggleMed(s, "m1").state.wilting).toBe(false);
  });
  it("bloomed plant is placed in an empty tile of a 16-tile garden", () => {
    const { s } = grow("vine", 3);
    expect(s.garden.length).toBe(16);
    const placed = placePending(s, 5);
    expect(placed.garden[5]?.type).toBe("vine");
    expect(placed.pending).toBe(null);
  });
  it("morning meds first before 11am, evening first after 5pm", () => {
    const meds = initialState().meds;
    expect(sortMeds(meds, 9)[0].time).toBe("Morning");
    expect(sortMeds(meds, 19)[0].time).toBe("Evening");
  });
  it("stage names", () => {
    expect([0, 1, 4, 7].map((p) => stageOf(p, 7))).toEqual(["Seed", "Sprout", "Bud", "Bloom"]);
  });
});
