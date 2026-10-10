import { PLANTS, stageOf, type PlantType } from "@/lib/bloom";

export function Plant({ type, progress, wilting, size = 280 }: { type: PlantType; progress: number; wilting: boolean; size?: number }) {
  const stage = stageOf(progress);
  const p = PLANTS[type];
  const stemH = stage === "Seed" ? 0 : stage === "Sprout" ? 50 + progress * 8 : stage === "Bud" ? 100 + progress * 6 : 150;
  const topY = 210 - stemH;
  return (
    <svg viewBox="0 0 240 300" width={size} height={size * 1.25} className={`plant ${wilting ? "plant-wilt" : "plant-healthy"}`} role="img" aria-label={`${p.name}, ${stage} stage${wilting ? ", thirsty" : ""}`}>
      <ellipse cx="120" cy="290" rx="80" ry="8" fill="var(--soil-shadow)" />
      <g className="plant-body" style={{ transformOrigin: "120px 210px" }}>
        {stage === "Seed" && <ellipse cx="120" cy="204" rx="12" ry="8" fill="var(--seed)" />}
        {stemH > 0 && <path d={`M120 210 Q${type === "bonsai" ? 100 : 116} ${210 - stemH / 2} 120 ${topY}`} stroke={type === "bonsai" ? "var(--bark)" : "var(--stem)"} strokeWidth={type === "bonsai" ? 10 : 6} fill="none" strokeLinecap="round" />}
        {stemH > 30 && (
          <>
            <path className="leaf leaf-l" d={`M118 ${210 - stemH * 0.4} q-40 -10 -50 -30 q30 0 50 30`} fill="var(--leaf)" style={{ transformOrigin: `118px ${210 - stemH * 0.4}px` }} />
            <path className="leaf leaf-r" d={`M122 ${210 - stemH * 0.6} q40 -10 50 -30 q-30 0 -50 30`} fill="var(--leaf)" style={{ transformOrigin: `122px ${210 - stemH * 0.6}px` }} />
          </>
        )}
        {stage === "Bud" && <ellipse cx="120" cy={topY - 10} rx="14" ry="20" fill={p.petal} stroke="var(--leaf)" strokeWidth="4" />}
        {stage === "Bloom" && (
          <g>
            {Array.from({ length: 12 }).map((_, i) => (
              <ellipse key={i} cx="120" cy={topY - 32} rx="11" ry="26" fill={p.petal} transform={`rotate(${i * 30} 120 ${topY - 8})`} />
            ))}
            <circle cx="120" cy={topY - 8} r="18" fill={p.center} />
          </g>
        )}
      </g>
      <path d="M60 210 L180 210 L168 288 L72 288 Z" fill="var(--pot)" />
      <rect x="54" y="204" width="132" height="18" rx="6" fill="var(--pot-rim)" />
    </svg>
  );
}
