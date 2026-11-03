import Link from "next/link";
import { caseData, humanise, type CaseNode } from "@/lib/data";
import { layerLabel } from "@/lib/story";

// One failure scenario of the synthetic case drawn as a graph: what starts it, every
// element it passes through, the shared fault domain that defeats redundancy, and the
// service outcome it breaks. Two static drawings of the same graph: left to right on
// wide screens, top to bottom on phones. Every value is read from the case data.
export const PATH_SCENARIO = "FS-01";

const nodesById = new Map(caseData.nodes.map((n) => [n.id, n]));

type Placed = { id: string; node: CaseNode | null; rank: number; slot: number };

function build(scenarioId: string) {
  const scenario = caseData.scenarios.find((s) => s.id === scenarioId)!;
  const ids: string[] = [];
  for (const st of scenario.steps) for (const id of [st.from, st.to]) if (!ids.includes(id)) ids.push(id);

  // Rank = longest distance from where the failure starts, so parallel elements share a rank.
  const rank = new Map<string, number>(ids.map((id) => [id, 0]));
  for (let pass = 0; pass < ids.length; pass++)
    for (const st of scenario.steps) rank.set(st.to, Math.max(rank.get(st.to)!, rank.get(st.from)! + 1));

  const placed: Placed[] = [{ id: "start", node: null, rank: 0, slot: 0 }];
  const perRank = new Map<number, number>();
  for (const id of ids) {
    const r = rank.get(id)! + 1;
    const slot = perRank.get(r) ?? 0;
    perRank.set(r, slot + 1);
    placed.push({ id, node: nodesById.get(id)!, rank: r, slot });
  }
  const ranks = Math.max(...placed.map((p) => p.rank)) + 1;
  const widest = Math.max(1, ...perRank.values());

  const edges = [
    ...scenario.steps.filter((s) => rank.get(s.from) === 0).map((s) => ({ from: "start", to: s.from, path: true })),
    ...scenario.steps.map((s) => ({ ...s, path: true })),
    // Where the failure reaches an element and the scenario records no further step from it,
    // show what that element is part of, so it does not look like a dead end.
    ...caseData.edges
      .filter((e) => ids.includes(e.from) && ids.includes(e.to))
      .filter((e) => !scenario.steps.some((s) => s.from === e.from))
      .map((e) => ({ from: e.from, to: e.to, path: false })),
  ].filter((e, i, all) => all.findIndex((x) => x.from === e.from && x.to === e.to) === i);

  const faultDomains = caseData.faultDomains
    .map((fd) => ({ ...fd, onPath: fd.members.filter((m) => ids.includes(m)) }))
    .filter((fd) => fd.onPath.length >= 2);

  const initiators = caseData.initiators.filter((i) => scenario.initiatedBy.includes(i.id));
  const safeguards = caseData.safeguards.filter((s) => scenario.safeguards.includes(s.id));
  const outcomes = scenario.effects.filter((e) => e.exceedsTolerance).map((e) => e.outcome);
  return { scenario, placed, ranks, widest, perRank, edges, faultDomains, initiators, safeguards, outcomes };
}

// Splits a name into lines of at most n characters, on word boundaries.
function wrap(s: string, n: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const w of s.split(" ")) {
    if (cur && (cur + " " + w).length > n) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

type Geometry = { w: number; h: number; x: (p: Placed) => number; y: (p: Placed) => number; width: number; height: number; chars: number };

function Drawing({ g, data, vertical, label }: { g: Geometry; data: ReturnType<typeof build>; vertical: boolean; label: string }) {
  const pos = new Map(data.placed.map((p) => [p.id, { x: g.x(p), y: g.y(p) }]));
  const start = data.initiators.map((i) => i.name).join("; ");
  const marker = vertical ? "fpg-arrow-v" : "fpg-arrow-h";
  return (
    <svg className={vertical ? "fpg-tall" : "fpg-wide"} viewBox={`0 0 ${g.width} ${g.height}`} role="img" aria-label={label}>
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
        </marker>
      </defs>
      {data.faultDomains.map((fd) => {
        const pts = fd.onPath.map((m) => pos.get(m)!);
        const x = Math.min(...pts.map((p) => p.x)) - 8;
        const y = Math.min(...pts.map((p) => p.y)) - 24;
        const w = Math.max(...pts.map((p) => p.x)) + g.w + 8 - x;
        const h = Math.max(...pts.map((p) => p.y)) + g.h + 8 - y;
        return (
          <g key={fd.id}>
            <rect className="fpg-fd" x={x} y={y} width={w} height={h} rx={10} />
            <text className="fpg-fd-label" x={vertical ? x + w - 10 : x + 10} y={y + 15} textAnchor={vertical ? "end" : "start"}>
              {fd.id} shared fault domain
            </text>
          </g>
        );
      })}
      {data.edges.map((e) => {
        const a = pos.get(e.from)!;
        const b = pos.get(e.to)!;
        let d: string;
        if (vertical) {
          const x1 = a.x + g.w / 2, y1 = a.y + g.h, x2 = b.x + g.w / 2, y2 = b.y;
          const mid = (y1 + y2) / 2;
          d = `M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}`;
        } else {
          const x1 = a.x + g.w, y1 = a.y + g.h / 2, x2 = b.x, y2 = b.y + g.h / 2;
          const mid = (x1 + x2) / 2;
          d = `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`;
        }
        return <path key={`${e.from}>${e.to}`} d={d} className={e.path ? "fpg-edge on-path" : "fpg-edge"} markerEnd={`url(#${marker})`} />;
      })}
      {data.placed.map((p) => {
        const { x, y } = pos.get(p.id)!;
        const isStart = p.node === null;
        const breached = p.node ? data.outcomes.includes(p.node.id) : false;
        const kind = isStart ? "Starts with" : layerLabel(p.node!);
        const name = isStart ? start : p.node!.name;
        return (
          <g key={p.id} className={`fpg-node${isStart ? " start" : ""}${breached ? " breached" : ""}`} transform={`translate(${x},${y})`}>
            <rect width={g.w} height={g.h} rx={6} />
            <text className="fpg-kind" x={9} y={15}>
              {kind.toUpperCase()}
            </text>
            {wrap(name, g.chars).map((line, i) => (
              <text key={i} className="fpg-name" x={9} y={32 + i * 15}>
                {line}
              </text>
            ))}
            {breached && (
              <text className="fpg-flag" x={9} y={g.h - 8}>
                BREACH (ILLUSTRATIVE)
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function FailurePathGraph({ scenarioId = PATH_SCENARIO }: { scenarioId?: string }) {
  const data = build(scenarioId);
  const { scenario } = data;

  const wide: Geometry = (() => {
    const w = 150, h = 74, gapX = 34, gapY = 38, top = 26;
    const colH = (r: number) => (data.perRank.get(r) ?? 1) * (h + gapY) - gapY;
    const height = top + data.widest * (h + gapY) - gapY + 8;
    return {
      w, h, chars: 19,
      width: data.ranks * (w + gapX) - gapX + 16,
      height,
      x: (p) => 8 + p.rank * (w + gapX),
      y: (p) => top + (height - top - 8 - colH(p.rank)) / 2 + p.slot * (h + gapY),
    };
  })();
  const tall: Geometry = (() => {
    const width = 340, gapX = 12, gapY = 54, h = 66, left = 8;
    const w = Math.floor((width - 2 * left - (data.widest - 1) * gapX) / data.widest);
    const rowW = (r: number) => (data.perRank.get(r) ?? 1) * (w + gapX) - gapX;
    return {
      w, h, chars: Math.max(14, Math.floor(w / 7.2)),
      width,
      height: 26 + data.ranks * (h + gapY) - gapY + 8,
      x: (p) => (width - rowW(p.rank)) / 2 + p.slot * (w + gapX),
      y: (p) => 26 + p.rank * (h + gapY),
    };
  })();

  const pathNames = data.placed.filter((p) => p.node).map((p) => p.node!.name);
  const fd = data.faultDomains[0];
  const label = `Synthetic failure scenario ${scenario.id}, ${scenario.name}. Starts with ${data.initiators
    .map((i) => i.name)
    .join(" and ")}, then reaches ${pathNames.join(", then ")}.${fd ? ` ${fd.onPath.map((m) => nodesById.get(m)?.name).join(", ")} share fault domain ${fd.id}.` : ""}`;

  return (
    <figure className="fpg">
      <p className="matrix-cap">
        <span className="story-tag">Synthetic example</span>
        <span className="mono">{scenario.id}</span> {scenario.name}
        {fd ? ": how a shared fault domain defeats redundancy." : "."}
      </p>
      <div className="fpg-frame">
        <Drawing g={wide} data={data} vertical={false} label={label} />
        <Drawing g={tall} data={data} vertical label={label} />
      </div>
      <p className="legend" aria-hidden="true">
        <span>
          <i className="path" /> failure path in the scenario
        </span>
        <span>
          <i className="dash" /> part of
        </span>
        <span>
          <i className="fd" /> shared fault domain
        </span>
      </p>
      <div className="fpg-notes">
        {fd && (
          <p>
            <b>Shared fault domain {fd.id}.</b> {fd.commonMode} Elements inside it fail together, so having two of them
            does not help against this failure.
          </p>
        )}
        {data.safeguards.map((s) => (
          <p key={s.id}>
            <b>Safeguard meant to limit it: {s.name}.</b>{" "}
            {s.implementedBy.length > 0 && (
              <>Implemented by {s.implementedBy.map((id) => nodesById.get(id)?.name ?? id).join(" and ")}. </>
            )}
            {s.controls.map((id) => {
              const c = caseData.controls[id];
              return (
                <span key={id} className="fpg-control">
                  <span className="mono small">{id}</span> {c?.title ?? ""}{" "}
                  <span className={`state s-${(c?.result ?? "NOT_ASSESSED").toLowerCase()}`}>{humanise(c?.result ?? "NOT_ASSESSED")}</span>{" "}
                </span>
              );
            })}
          </p>
        ))}
      </div>
      <p className="story-foot">
        <Link className="btn" href="/case/">
          Explore the full dependency graph
        </Link>
        <span className="small muted">Drawn from the AIDCF-015 synthetic dataset. It describes no real facility.</span>
      </p>
    </figure>
  );
}
