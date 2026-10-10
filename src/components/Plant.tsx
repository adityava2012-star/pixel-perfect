import { PLANTS, stageOf, type PlantType, type StageName } from "@/lib/bloom";

export function Plant({ type, progress, wilting, size = 280 }: { type: PlantType; progress: number; wilting: boolean; size?: number }) {
  const stage = stageOf(progress, PLANTS[type].days);
  const sandy = type === "dragonfruit";
  return (
    <svg viewBox="0 0 240 300" width={size} height={size * 1.25} className={`plant ${wilting ? "plant-wilt" : "plant-healthy"}`} role="img" aria-label={`${PLANTS[type].name}, ${stage} stage${wilting ? ", thirsty" : ""}`}>
      <ellipse cx="120" cy="290" rx="80" ry="8" fill="var(--soil-shadow)" />
      <g className="plant-body" style={{ transformOrigin: "120px 210px" }}>
        {type === "bonsai" && <Bonsai stage={stage} />}
        {type === "vine" && <Vine stage={stage} />}
        {type === "dragonfruit" && <Dragon stage={stage} />}
      </g>
      <path d="M60 210 L180 210 L168 288 L72 288 Z" fill={type === "bonsai" ? "var(--pot-ceramic)" : "var(--pot)"} />
      <rect x="54" y="204" width="132" height="18" rx="6" fill={type === "bonsai" ? "var(--pot-ceramic-rim)" : "var(--pot-rim)"} />
      {sandy && <rect x="60" y="200" width="120" height="6" rx="3" fill="var(--sand)" />}
    </svg>
  );
}

const blossoms: [number, number, number][] = [[70, 120, 26], [100, 100, 30], [140, 98, 30], [172, 118, 26], [120, 80, 28], [86, 140, 20], [158, 140, 20], [120, 116, 24]];

function Bonsai({ stage }: { stage: StageName }) {
  if (stage === "Seed") return <><ellipse cx="120" cy="204" rx="11" ry="7" fill="var(--seed)" /><path d="M100 206 q20 -6 40 0" stroke="var(--soil)" strokeWidth="5" fill="none" /></>;
  if (stage === "Sprout") return (
    <>
      <path d="M120 206 Q100 180 118 160" stroke="var(--bark)" strokeWidth="12" fill="none" strokeLinecap="round" />
      <ellipse className="leaf" cx="108" cy="152" rx="12" ry="6" fill="var(--leaf)" transform="rotate(-30 108 152)" />
      <ellipse className="leaf" cx="128" cy="152" rx="12" ry="6" fill="var(--leaf)" transform="rotate(30 128 152)" />
    </>
  );
  const trunk = <path d="M120 206 Q92 170 122 140 Q146 118 120 96" stroke="var(--bark)" strokeWidth="14" fill="none" strokeLinecap="round" />;
  const branches = <><path d="M112 156 Q86 146 70 128" stroke="var(--bark)" strokeWidth="7" fill="none" strokeLinecap="round" /><path d="M130 130 Q156 124 172 116" stroke="var(--bark)" strokeWidth="7" fill="none" strokeLinecap="round" /></>;
  if (stage === "Bud") return (
    <>{trunk}{branches}
      {[[70, 126], [82, 138], [172, 114], [160, 122], [120, 92], [128, 100]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill="var(--plant-blossom-dark)" />)}
      {[[94, 146], [148, 124], [114, 100]].map(([x, y], i) => <ellipse key={i} className="leaf" cx={x} cy={y} rx="9" ry="5" fill="var(--leaf)" />)}
    </>
  );
  return (
    <>{trunk}{branches}
      {blossoms.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? "var(--plant-blossom)" : "var(--plant-blossom-mid)"} />)}
      {blossoms.flatMap(([x, y], i) => [<circle key={`a${i}`} cx={x - 8} cy={y - 6} r="3" fill="var(--plant-blossom-dark)" />, <circle key={`b${i}`} cx={x + 9} cy={y + 5} r="3" fill="var(--card)" />])}
      <path d="M60 176 q4 8 0 14 M180 180 q-4 8 0 12" stroke="var(--plant-blossom-mid)" strokeWidth="6" strokeLinecap="round" fill="none" />
    </>
  );
}

function Trellis() {
  return (
    <g stroke="var(--wood)" strokeWidth="5" strokeLinecap="round">
      {[80, 120, 160].map((x) => <line key={x} x1={x} y1="204" x2={x} y2="50" />)}
      {[70, 110, 150, 190].map((y) => <line key={y} x1="70" y1={y} x2="170" y2={y} />)}
    </g>
  );
}
const vineLeaves: [number, number, number][] = [[84, 186, -30], [156, 180, 30], [96, 160, 20], [144, 150, -20], [80, 130, -40], [162, 120, 40], [108, 110, 10], [134, 90, -10], [86, 80, -30], [158, 66, 30], [120, 60, 0], [100, 190, 50], [140, 170, -50], [120, 140, 0], [72, 104, -10], [168, 96, 20]];
const stars: [number, number][] = [[92, 120], [150, 100], [120, 80], [80, 160], [160, 150], [104, 66], [142, 56], [124, 170], [70, 90], [172, 74], [112, 140]];

function Vine({ stage }: { stage: StageName }) {
  if (stage === "Seed") return <>{[104, 120, 136].map((x) => <g key={x}><ellipse cx={x} cy="204" rx="6" ry="4" fill="var(--seed-light)" stroke="var(--seed)" strokeWidth="1.5" /><circle cx={x - 2} cy="203" r="1" fill="var(--seed)" /><circle cx={x + 2} cy="205" r="1" fill="var(--seed)" /></g>)}</>;
  if (stage === "Sprout") return (
    <>
      <path d="M120 206 Q100 196 76 198 M120 206 Q140 196 164 198" stroke="var(--stem)" strokeWidth="4" fill="none" />
      <ellipse className="leaf" cx="86" cy="194" rx="12" ry="7" fill="var(--leaf)" /><ellipse className="leaf" cx="154" cy="194" rx="12" ry="7" fill="var(--leaf)" />
      <ellipse className="leaf" cx="112" cy="196" rx="9" ry="6" fill="var(--leaf)" /><ellipse className="leaf" cx="128" cy="196" rx="9" ry="6" fill="var(--leaf)" />
    </>
  );
  const full = stage === "Bloom";
  return (
    <>
      <Trellis />
      <path d={full ? "M120 206 C80 170 160 140 110 110 C70 80 160 70 120 50" : "M120 206 C90 180 150 160 112 128"} stroke="var(--stem)" strokeWidth="4" fill="none" />
      <path d={full ? "M110 206 C70 160 90 120 80 70 M130 206 C170 160 150 110 166 60" : "M126 206 C150 190 140 170 156 150"} stroke="var(--stem)" strokeWidth="3" fill="none" />
      {(full ? vineLeaves : vineLeaves.slice(0, 5)).map(([x, y, r], i) => <ellipse key={i} className="leaf" cx={x} cy={y} rx={full ? 13 : 10} ry={full ? 8 : 6} fill={full ? "var(--leaf-dark)" : "var(--leaf)"} transform={`rotate(${r} ${x} ${y})`} />)}
      {full && stars.map(([x, y], i) => <Star key={i} x={x} y={y} />)}
    </>
  );
}
function Star({ x, y }: { x: number; y: number }) {
  const pts = Array.from({ length: 10 }, (_, i) => { const a = (Math.PI / 5) * i - Math.PI / 2; const r = i % 2 ? 3 : 8; return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`; }).join(" ");
  return <><polygon points={pts} fill="var(--star)" /><circle cx={x} cy={y} r="1.8" fill="var(--plant-sunflower)" /></>;
}

function Dragon({ stage }: { stage: StageName }) {
  if (stage === "Seed") return <><ellipse cx="120" cy="198" rx="10" ry="3.5" fill="var(--seed)" />{[100, 112, 132, 144].map((x) => <circle key={x} cx={x} cy="201" r="1.5" fill="var(--sand-dark)" />)}</>;
  const spikes = (pts: [number, number][]) => pts.map(([x, y], i) => <line key={i} x1={x} y1={y} x2={x + (i % 2 ? 6 : -6)} y2={y - 4} stroke="var(--spike)" strokeWidth="2" strokeLinecap="round" />);
  if (stage === "Sprout") return <><path d="M104 202 L120 158 L136 202 Z" fill="var(--cactus)" stroke="var(--cactus-dark)" strokeWidth="3" strokeLinejoin="round" />{spikes([[110, 186], [130, 186], [114, 172], [126, 172], [118, 162]])}</>;
  const segs: [number, number, number][] = stage === "Bloom"
    ? [[108, 170, -10], [104, 136, 10], [110, 102, -8], [132, 176, 12], [138, 142, -6], [134, 108, 10], [92, 82, -50], [150, 80, 50]]
    : [[108, 170, -10], [104, 136, 10], [132, 176, 12], [138, 142, -6]];
  return (
    <>
      <rect x="116" y="56" width="10" height="150" rx="3" fill="var(--wood)" />
      {segs.map(([x, y, r], i) => <g key={i} transform={`rotate(${r} ${x} ${y})`}><rect x={x - 9} y={y - 17} width="18" height="34" rx="8" fill="var(--cactus)" stroke="var(--cactus-dark)" strokeWidth="3" />{spikes([[x - 9, y - 6], [x + 9, y - 6], [x - 9, y + 8], [x + 9, y + 8]])}</g>)}
      {stage === "Bloom" && (
        <>
          {[[84, 64], [158, 62], [104, 76]].map(([x, y], i) => <g key={i}>{Array.from({ length: 8 }).map((_, k) => <ellipse key={k} cx={x} cy={y - 12} rx="6" ry="14" fill="var(--star)" transform={`rotate(${k * 45} ${x} ${y})`} />)}<circle cx={x} cy={y} r="5" fill="var(--plant-sunflower)" /></g>)}
          {[[140, 116], [96, 148], [146, 160]].map(([x, y], i) => <g key={i}><ellipse cx={x} cy={y} rx="12" ry="15" fill="var(--dragon)" /><path d={`M${x - 10} ${y - 6} l-6 -6 M${x + 10} ${y - 6} l6 -6 M${x} ${y - 15} l0 -7`} stroke="var(--cactus)" strokeWidth="3" strokeLinecap="round" /></g>)}
        </>
      )}
    </>
  );
}
