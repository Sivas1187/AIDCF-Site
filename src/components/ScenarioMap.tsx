"use client";

import { useState } from "react";

type Domain = { id: string; name: string; scenarios: string[] };
type Crossing = { from: string; to: string; scenarios: string[] };

const SIZE = 480;
const C = SIZE / 2;
const R = 182;

/**
 * Where the twenty library scenarios cross from one domain to another. Domains
 * sit on a circle in the order of the seven domain clusters; a line is a step
 * that AIDCF-004 marks "A → B", thicker when more scenarios share it. Selecting
 * a domain shows what leaves and enters it.
 */
export function ScenarioMap({ domains, crossings }: { domains: Domain[]; crossings: Crossing[] }) {
  const [sel, setSel] = useState<string | null>(null);
  const pos = new Map(
    domains.map((d, i) => {
      const a = (2 * Math.PI * i) / domains.length - Math.PI / 2;
      return [d.id, { x: C + R * Math.cos(a), y: C + R * Math.sin(a) }];
    }),
  );
  const rOf = (d: Domain) => 15 + Math.min(d.scenarios.length, 12) * 0.7;
  const byId = new Map(domains.map((d) => [d.id, d]));
  const twoWay = new Set(crossings.map((c) => `${c.from}>${c.to}`));

  const edgePath = (c: Crossing) => {
    const a = pos.get(c.from)!;
    const b = pos.get(c.to)!;
    // bow toward the centre; the two directions of a pair bow to opposite sides
    const back = twoWay.has(`${c.to}>${c.from}`);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const nx = -(b.y - a.y);
    const ny = b.x - a.x;
    const len = Math.hypot(nx, ny) || 1;
    const bend = back ? 22 : 0;
    const cx = mx + ((C - mx) * 0.35) + (nx / len) * bend;
    const cy = my + ((C - my) * 0.35) + (ny / len) * bend;
    // stop short of the target circle so the arrow head shows
    const ra = rOf(byId.get(c.from)!);
    const rb = rOf(byId.get(c.to)!) + 3;
    const ta = Math.atan2(cy - a.y, cx - a.x);
    const tb = Math.atan2(cy - b.y, cx - b.x);
    return `M${a.x + ra * Math.cos(ta)},${a.y + ra * Math.sin(ta)} Q${cx},${cy} ${b.x + rb * Math.cos(tb)},${b.y + rb * Math.sin(tb)}`;
  };

  const edgeClass = (c: Crossing) =>
    sel === null ? "sm-edge" : c.from === sel ? "sm-edge out" : c.to === sel ? "sm-edge in" : "sm-edge dim";
  const touches = (id: string) => sel === id || crossings.some((c) => (c.from === sel && c.to === id) || (c.to === sel && c.from === id));

  const out = crossings.filter((c) => c.from === sel);
  const inn = crossings.filter((c) => c.to === sel);
  const d = sel ? byId.get(sel)! : null;
  const list = (cs: Crossing[], key: "from" | "to") => (
    <ul className="sm-list">
      {cs.map((c) => (
        <li key={`${c.from}${c.to}`}>
          <span className="mono">{c[key]}</span> {byId.get(c[key])?.name} · {c.scenarios.length}{" "}
          {c.scenarios.length === 1 ? "scenario" : "scenarios"}:{" "}
          {c.scenarios.map((x, i) => (
            <span key={x}>
              {i > 0 && " "}
              <a href={`#${x}`} className="mono">
                {x}
              </a>
            </span>
          ))}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="sm">
      <div className="sm-figure">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="group" aria-label="Domain crossings across the twenty library scenarios. Select a domain to see what leaves and enters it; the list beside the map gives the same information as text.">
          <defs>
            <marker id="sm-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
            </marker>
          </defs>
          {crossings.map((c) => (
            <path
              key={`${c.from}>${c.to}`}
              d={edgePath(c)}
              className={edgeClass(c)}
              strokeWidth={1 + c.scenarios.length * 0.9}
              markerEnd="url(#sm-arrow)"
            >
              <title>{`${c.from} → ${c.to}: ${c.scenarios.join(", ")}`}</title>
            </path>
          ))}
          {domains.map((dm) => {
            const p = pos.get(dm.id)!;
            const r = rOf(dm);
            const cls = `sm-node${sel === dm.id ? " selected" : ""}${sel && !touches(dm.id) ? " dim" : ""}${dm.scenarios.length ? "" : " empty"}`;
            return (
              <g
                key={dm.id}
                className={cls}
                transform={`translate(${p.x},${p.y})`}
                role="button"
                tabIndex={0}
                aria-pressed={sel === dm.id}
                aria-label={`${dm.id} ${dm.name}: on the path of ${dm.scenarios.length} scenarios`}
                onClick={() => setSel(sel === dm.id ? null : dm.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSel(sel === dm.id ? null : dm.id);
                  }
                }}
              >
                <title>{`${dm.id} ${dm.name}: ${dm.scenarios.length} scenarios`}</title>
                <circle r={r} />
                <text y={-1} textAnchor="middle" className="sm-id">
                  {dm.id}
                </text>
                <text y={11} textAnchor="middle" className="sm-count">
                  {dm.scenarios.length}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="sm-panel" aria-live="polite">
        {d ? (
          <>
            <h3>
              <span className="mono">{d.id}</span> {d.name}
            </h3>
            <p className="small">
              On the path of {d.scenarios.length} scenarios.{" "}
              <button type="button" className="linklike small" onClick={() => setSel(null)}>
                Show all crossings
              </button>
            </p>
            <h4>Failure moves on from {d.id} to</h4>
            {out.length ? list(out, "to") : <p className="small muted">No step marks a crossing out of {d.id}.</p>}
            <h4>Failure arrives in {d.id} from</h4>
            {inn.length ? list(inn, "from") : <p className="small muted">No step marks a crossing into {d.id}.</p>}
          </>
        ) : (
          <>
            <h3>Most shared crossings</h3>
            <p className="small muted">Select a domain on the map for its crossings in and out.</p>
            <ul className="sm-list">
              {crossings.slice(0, 8).map((c) => (
                <li key={`${c.from}${c.to}`}>
                  <span className="mono">
                    {c.from} → {c.to}
                  </span>{" "}
                  · {c.scenarios.length}:{" "}
                  {c.scenarios.map((x, i) => (
                    <span key={x}>
                      {i > 0 && " "}
                      <a href={`#${x}`} className="mono">
                        {x}
                      </a>
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
