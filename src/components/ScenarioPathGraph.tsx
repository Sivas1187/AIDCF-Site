import type { LibraryScenario } from "@/lib/scenarios";
import { parseSafeguard, stepRelations } from "@/lib/scenarioGraph";

const LABEL_W = 70;
const COL_W = 118;
const NODE_W = 104;
const NODE_H = 26;
const LANE_H = 40;
const TOP = 26;
const GUARD_H = 46;

const verbClass = (v: string) => (v === "interrupts" ? "sp-guard stop" : "sp-guard limit");

/**
 * One library scenario's propagation path: steps left to right in the order
 * AIDCF-004 lists them, one lane per domain. A step marked "A → B" is drawn
 * as a crossing from lane A to lane B; "A/B" sits in both lanes. Safeguards
 * are drawn under the step they cite. The numbered list beside it is the
 * text version.
 */
export function ScenarioPathGraph({ s }: { s: LibraryScenario }) {
  const lanes: string[] = [];
  for (const p of s.path) for (const g of p.stages) for (const d of g) if (!lanes.includes(d)) lanes.push(d);
  const laneY = (d: string) => TOP + lanes.indexOf(d) * LANE_H + (LANE_H - NODE_H) / 2;
  const colX = (i: number) => LABEL_W + i * COL_W + (COL_W - NODE_W) / 2;
  const width = LABEL_W + s.path.length * COL_W + 8;
  const guardsY = TOP + lanes.length * LANE_H + 8;
  const height = guardsY + GUARD_H;

  const guards = s.safeguards.map(parseSafeguard);
  const byStep = new Map<number, { verb: string; kind: string; text: string }[]>();
  for (const g of guards)
    for (const r of g.refs)
      for (const n of r.steps) {
        if (!byStep.has(n)) byStep.set(n, []);
        byStep.get(n)!.push({ verb: r.verb, kind: g.kind, text: g.text });
      }
  const unplaced = guards.filter((g) => !g.refs.length).length;

  const first = (i: number) => s.path[i].stages[0]?.[0];
  const last = (i: number) => {
    const st = s.path[i].stages;
    return st[st.length - 1]?.[0];
  };
  const markerId = `sp-arrow-${s.id}`;

  return (
    <figure className="sp">
      <div className="graph-frame sp-frame">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={`Failure path of ${s.id}: ${s.path.length} steps across ${lanes.join(", ")}, with ${guards.length} safeguards. The numbered steps below give the same path as text.`}
        >
          <defs>
            <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
            </marker>
          </defs>
          {lanes.map((d, i) => (
            <g key={d}>
              <rect className={`sp-lane${i % 2 ? " alt" : ""}`} x={0} y={TOP + i * LANE_H} width={width} height={LANE_H} />
              <text className="sp-lane-label" x={8} y={TOP + i * LANE_H + LANE_H / 2 + 4}>
                {d}
              </text>
            </g>
          ))}
          {s.path.map((_, i) => (
            <text key={i} className="g-col-label" x={colX(i) + NODE_W / 2} y={17} textAnchor="middle">
              Step {i + 1}
            </text>
          ))}
          <text className="sp-lane-label" x={8} y={guardsY + 22}>
            Safeguards
          </text>

          {/* order of the steps, as listed */}
          {s.path.slice(1).map((_, k) => {
            const i = k + 1;
            const a = last(i - 1);
            const b = first(i);
            if (!a || !b) return null;
            const x1 = colX(i - 1) + NODE_W;
            const y1 = laneY(a) + NODE_H / 2;
            const x2 = colX(i);
            const y2 = laneY(b) + NODE_H / 2;
            const mx = (x1 + x2) / 2;
            return (
              <path
                key={`n${i}`}
                className="sp-next"
                d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2 - 2},${y2}`}
                markerEnd={`url(#${markerId})`}
              />
            );
          })}

          {/* crossings inside a step: "A → B" */}
          {s.path.map((p, i) =>
            p.stages.slice(1).map((g, k) => {
              const from = p.stages[k][0];
              const to = g[0];
              if (!from || !to || from === to) return null;
              const x = colX(i) + NODE_W / 2;
              const down = laneY(to) > laneY(from);
              const y1 = laneY(from) + (down ? NODE_H : 0);
              const y2 = laneY(to) + (down ? 0 : NODE_H);
              return (
                <path
                  key={`c${i}-${k}`}
                  className="sp-cross"
                  d={`M${x},${y1} L${x},${y2 + (down ? -2 : 2)}`}
                  markerEnd={`url(#${markerId})`}
                />
              );
            }),
          )}

          {/* a step placed in two domains at once: "A/B" */}
          {s.path.map((p, i) =>
            p.stages.map((g, k) => {
              if (g.length < 2) return null;
              const ys = g.map((d) => laneY(d));
              const x = colX(i) + NODE_W / 2;
              return (
                <line
                  key={`j${i}-${k}`}
                  className="sp-joint"
                  x1={x}
                  x2={x}
                  y1={Math.min(...ys) + NODE_H}
                  y2={Math.max(...ys)}
                />
              );
            }),
          )}

          {s.path.map((p, i) => {
            const rel = stepRelations(p.text)[0];
            return p.stages.flatMap((g, k) =>
              g.map((d, j) => {
                const lead = k === 0 && j === 0;
                return (
                  <g key={`${i}-${d}`} className="sp-node" transform={`translate(${colX(i)},${laneY(d)})`}>
                    <title>{`Step ${i + 1} (${d}): ${p.text}`}</title>
                    <rect width={NODE_W} height={NODE_H} rx={5} />
                    <text className="sp-num" x={8} y={17}>
                      {i + 1}
                    </text>
                    {lead && rel && (
                      <text className="sp-rel" x={22} y={17}>
                        {rel.replace(/_/g, " ").toLowerCase()}
                      </text>
                    )}
                  </g>
                );
              }),
            );
          })}

          {[...byStep.entries()].map(([n, list]) => {
            if (n < 1 || n > s.path.length) return null;
            const x = colX(n - 1) + NODE_W / 2;
            const stop = list.some((g) => g.verb === "interrupts");
            return (
              <g key={`g${n}`} className={verbClass(stop ? "interrupts" : "limits")}>
                <title>{list.map((g) => `${g.verb} step ${n}: ${g.kind ? `${g.kind}: ` : ""}${g.text}`).join("\n")}</title>
                <line x1={x} y1={guardsY - 6} x2={x} y2={guardsY + 6} />
                <rect x={x - 30} y={guardsY + 8} width={60} height={22} rx={11} />
                <text x={x} y={guardsY + 23} textAnchor="middle">
                  {stop ? "stops" : "limits"}
                  {list.length > 1 ? ` ×${list.length}` : ""}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="small muted">
        Steps in the order AIDCF-004 lists them; a vertical arrow is a step the source marks as crossing from one
        domain to another, and a dotted line joins a step it places in two domains at once. Under each step, the safeguards that cite it: <span className="sp-key stop">stops</span>{" "}
        interrupts the step, <span className="sp-key limit">limits</span> limits, contains or delays it.
        {unplaced > 0 && ` ${unplaced} safeguard${unplaced > 1 ? "s" : ""} cite${unplaced > 1 ? "" : "s"} no step.`} Hover a
        box for its text.
      </figcaption>
    </figure>
  );
}
