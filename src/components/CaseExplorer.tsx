"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { caseData, framework, gateName, humanise, percent, sourceUrl, type CaseEdge, type CaseNode, type NodeKind } from "@/lib/data";

// ------------------------------------------------------------- layout

const COLS: { kind: NodeKind; label: string }[] = [
  { kind: "external", label: "External" },
  { kind: "asset", label: "Assets" },
  { kind: "system", label: "Systems" },
  { kind: "function", label: "Required functions" },
  { kind: "outcome", label: "Service outcomes" },
];
const NODE_W = 170;
const NODE_H = 42;
const ROW = 54;
const COL_GAP = 198;
const PAD_X = 34;
const PAD_TOP = 44;

const nodesById = new Map(caseData.nodes.map((n) => [n.id, n]));
const colIndex = (k: NodeKind) => COLS.findIndex((c) => c.kind === k);
const maxRows = Math.max(...COLS.map((c) => caseData.nodes.filter((n) => n.kind === c.kind).length));
const HEIGHT = PAD_TOP + maxRows * ROW + 24;
const WIDTH = PAD_X * 2 + (COLS.length - 1) * COL_GAP + NODE_W;

const positions = new Map<string, { x: number; y: number }>();
for (const c of COLS) {
  const list = caseData.nodes.filter((n) => n.kind === c.kind);
  const offset = ((maxRows - list.length) * ROW) / 2;
  list.forEach((n, i) => {
    positions.set(n.id, { x: PAD_X + colIndex(c.kind) * COL_GAP, y: PAD_TOP + offset + i * ROW });
  });
}

function edgePath(e: { from: string; to: string }): string {
  const a = positions.get(e.from);
  const b = positions.get(e.to);
  if (!a || !b) return "";
  const ca = colIndex(nodesById.get(e.from)!.kind);
  const cb = colIndex(nodesById.get(e.to)!.kind);
  const ay = a.y + NODE_H / 2;
  const by = b.y + NODE_H / 2;
  if (ca < cb) {
    const x1 = a.x + NODE_W;
    const x2 = b.x;
    const mid = (x1 + x2) / 2;
    return `M${x1},${ay} C${mid},${ay} ${mid},${by} ${x2},${by}`;
  }
  if (ca === cb) {
    // Same column: arc out to the right of the column.
    const x = a.x + NODE_W;
    const bulge = 26 + Math.min(40, Math.abs(by - ay) / 6);
    return `M${x},${ay} C${x + bulge},${ay} ${x + bulge},${by} ${x},${by}`;
  }
  // Backwards (towards an upstream column): leave from the left side.
  const x1 = a.x;
  const x2 = b.x + NODE_W;
  return `M${x1},${ay} C${x1 - 40},${ay} ${x2 + 40},${by} ${x2},${by}`;
}

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const edgeKey = (e: { from: string; to: string }) => `${e.from}>${e.to}`;

const edgeVerb: Record<CaseEdge["kind"], [string, string]> = {
  composes: ["is part of", "contains"],
  implements: ["implements", "is implemented by"],
  requires: ["is required by", "requires"],
  depends: ["is relied on by", "relies on"],
  propagates: ["propagates failure to", "receives failure from"],
};

const resultClass = (r: string) => `state s-${r.toLowerCase()}`;

// ------------------------------------------------------ guided journey

const JOURNEY_DEFAULT = "FS-04";
const clusterOf = new Map(framework.clusters.flatMap((c) => c.domains.map((d) => [d, c.name] as const)));

function layerOf(n: CaseNode): string {
  if (n.kind === "function") return "AI service: required function";
  if (n.kind === "outcome") return "AI service: service outcome";
  const cluster = n.domain ? clusterOf.get(n.domain) : null;
  if (n.kind === "external") return cluster ? `External supply · ${cluster}` : "External supply";
  return cluster ?? humanise(n.kind);
}

type Scenario = (typeof caseData.scenarios)[number];
type JourneyStep = { kind: "node"; id: string } | { kind: "safeguards" } | { kind: "controls" } | { kind: "gates" } | { kind: "decision" };

function pathOrder(scenario: Scenario): string[] {
  const order: string[] = [];
  for (const st of scenario.steps) {
    if (!order.includes(st.from)) order.push(st.from);
    if (!order.includes(st.to)) order.push(st.to);
  }
  return order;
}

function journeySteps(scenario: Scenario): JourneyStep[] {
  return [
    ...pathOrder(scenario).map((id) => ({ kind: "node", id }) as JourneyStep),
    { kind: "safeguards" },
    { kind: "controls" },
    { kind: "gates" },
    { kind: "decision" },
  ];
}

// --------------------------------------------------------- component

export function CaseExplorer() {
  const [selected, setSelected] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState<string>("");
  const [view, setView] = useState<"graph" | "list">("graph");
  const [journey, setJourney] = useState<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 719px)").matches) setView("list");
  }, []);

  // /case/#journey (linked from the failure story) opens the guided journey.
  useEffect(() => {
    const read = () => {
      if (window.location.hash !== "#journey") return;
      setScenarioId((cur) => cur || JOURNEY_DEFAULT);
      setSelected(null);
      setJourney(0);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const scenario = caseData.scenarios.find((s) => s.id === scenarioId) ?? null;
  const steps = scenario ? journeySteps(scenario) : [];
  const order = scenario ? pathOrder(scenario) : [];
  const step = journey !== null ? steps[journey] : null;
  // During a journey only the elements reached so far are lit; the whole path is lit once it reaches the outcome.
  const reached = step ? new Set(step.kind === "node" ? order.slice(0, order.indexOf(step.id) + 1) : order) : null;
  const current = step?.kind === "node" ? step.id : null;
  const panelRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // When the panel sits below the graph, bring it into view after a choice.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!(selected || scenarioId) || (journey !== null && journey > 0) || window.matchMedia("(min-width: 1200px)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panelRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, scenarioId, journey === null]);

  const path = useMemo(() => {
    if (!scenario) return { nodes: new Set<string>(), edges: new Set<string>(), origin: new Set<string>() };
    const nodes = new Set<string>();
    const edges = new Set<string>();
    for (const st of scenario.steps) {
      if (reached && !(reached.has(st.from) && reached.has(st.to))) continue;
      nodes.add(st.from);
      nodes.add(st.to);
      edges.add(edgeKey(st));
    }
    if (reached) for (const id of reached) nodes.add(id);
    const origin = new Set(scenario.steps.length ? [scenario.steps[0].from] : []);
    return { nodes, edges, origin };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, journey]);

  // Path steps that are not already drawn as a structural edge get their own line.
  const extraPathEdges = scenario
    ? scenario.steps.filter((s) => path.edges.has(edgeKey(s)) && !caseData.edges.some((e) => edgeKey(e) === edgeKey(s)))
    : [];

  const neighbours = useMemo(() => {
    if (!selected) return new Set<string>();
    const set = new Set<string>([selected]);
    for (const e of caseData.edges) {
      if (e.from === selected) set.add(e.to);
      if (e.to === selected) set.add(e.from);
    }
    return set;
  }, [selected]);

  const select = (id: string) => {
    setJourney(null);
    setSelected((cur) => (cur === id ? null : id));
  };
  const startJourney = () => {
    if (!scenarioId) setScenarioId(JOURNEY_DEFAULT);
    setSelected(null);
    setJourney(0);
  };
  const onKey = (id: string) => (ev: KeyboardEvent) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      select(id);
    }
  };

  const nodeClass = (n: CaseNode) => {
    const c = ["g-node"];
    if (selected === n.id || current === n.id) c.push("selected");
    if (scenario) {
      if (path.nodes.has(n.id)) c.push("on-path");
      else if (selected !== n.id) c.push("dim");
    } else if (selected && !neighbours.has(n.id)) c.push("dim");
    return c.join(" ");
  };

  const edgeClass = (e: CaseEdge) => {
    const c = ["g-edge", e.kind];
    if (scenario) {
      if (path.edges.has(edgeKey(e))) c.push("on-path");
      else c.push("dim");
    } else if (selected) {
      if (e.from === selected || e.to === selected) c.push("hl");
      else c.push("dim");
    }
    return c.join(" ");
  };

  return (
    <div>
      <div className="toolbar" id="explorer-top">
        <label htmlFor="scenario">Failure scenario</label>
        <select
          id="scenario"
          value={scenarioId}
          onChange={(e) => {
            setScenarioId(e.target.value);
            setJourney(e.target.value && journey !== null ? 0 : null);
          }}
        >
          <option value="">None: explore the dependencies</option>
          {caseData.scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id}: {s.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn primary" onClick={startJourney} aria-pressed={journey !== null}>
          {journey !== null ? "Restart the journey" : "Guided journey"}
        </button>
        <span className="seg" role="group" aria-label="View">
          <button type="button" aria-pressed={view === "graph"} onClick={() => setView("graph")}>
            Graph
          </button>
          <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>
            List
          </button>
        </span>
        {(selected || scenarioId) && (
          <button
            type="button"
            className="btn"
            onClick={() => {
              setSelected(null);
              setScenarioId("");
              setJourney(null);
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="explorer">
        <div>
          {view === "graph" ? (
            <>
              <div className="graph-frame">
                <svg
                  viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                  role="group"
                  aria-label="Dependency graph of the synthetic capability. Failure travels from left to right. Use the list view for a text version."
                >
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
                    </marker>
                  </defs>
                  {COLS.map((c, i) => (
                    <text key={c.kind} className="g-col-label" x={PAD_X + i * COL_GAP} y={22}>
                      {c.label}
                    </text>
                  ))}
                  {caseData.faultDomains.map((fd) => {
                    const pts = fd.members.map((m) => positions.get(m)).filter(Boolean) as { x: number; y: number }[];
                    if (!pts.length) return null;
                    const x = Math.min(...pts.map((p) => p.x)) - 8;
                    const y = Math.min(...pts.map((p) => p.y)) - 6;
                    const w = Math.max(...pts.map((p) => p.x)) + NODE_W + 8 - x;
                    const h = Math.max(...pts.map((p) => p.y)) + NODE_H + 6 - y;
                    return (
                      <g key={fd.id}>
                        <title>{`${fd.id}: ${fd.commonMode} ${fd.blastRadius}`}</title>
                        <rect className="g-fd" x={x} y={y} width={w} height={h} rx={8} />
                        <text
                          className="g-fd-label"
                          x={x - 3}
                          y={y + h / 2}
                          textAnchor="middle"
                          transform={`rotate(-90 ${x - 3} ${y + h / 2})`}
                        >
                          {fd.id}
                        </text>
                      </g>
                    );
                  })}
                  {caseData.edges.map((e) => (
                    <path key={edgeKey(e)} d={edgePath(e)} className={edgeClass(e)} markerEnd="url(#arrow)">
                      <title>{`${nodesById.get(e.from)?.name} ${edgeVerb[e.kind][0]} ${nodesById.get(e.to)?.name}${e.label ? ` (${humanise(e.label)})` : ""}`}</title>
                    </path>
                  ))}
                  {extraPathEdges.map((e) => (
                    <path key={`x-${edgeKey(e)}`} d={edgePath(e)} className="g-edge on-path" markerEnd="url(#arrow)" />
                  ))}
                  {caseData.nodes.map((n) => {
                    const p = positions.get(n.id)!;
                    return (
                      <g
                        key={n.id}
                        className={nodeClass(n)}
                        transform={`translate(${p.x},${p.y})`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selected === n.id}
                        aria-label={`${n.name}, ${humanise(n.kind)}${n.domain ? `, domain ${n.domain}` : ""}${n.unknowns.length ? ", has an UNKNOWN" : ""}${path.nodes.has(n.id) ? ", on the failure path" : ""}`}
                        onClick={() => select(n.id)}
                        onKeyDown={onKey(n.id)}
                      >
                        <title>{n.name}</title>
                        <rect width={NODE_W} height={NODE_H} rx={6} />
                        <text className="g-id" x={10} y={15}>
                          {n.id}
                          {n.domain ? ` · ${n.domain}` : ""}
                        </text>
                        <text x={10} y={32}>
                          {truncate(n.name, 25)}
                        </text>
                        {n.unknowns.length > 0 && (
                          <text className="g-flag" x={NODE_W - 8} y={15} textAnchor="end">
                            UNKNOWN
                          </text>
                        )}
                        {path.origin.has(n.id) && (
                          <text className="g-flag" x={NODE_W - 8} y={15} textAnchor="end" style={{ fill: "var(--path)" }}>
                            ORIGIN
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="legend" aria-hidden="true">
                <span>
                  <i /> structure (part of, implements, required by)
                </span>
                <span>
                  <i className="dash" /> dependency
                </span>
                <span>
                  <i className="fd" /> shared fault domain
                </span>
                <span>
                  <i className="path" /> failure path
                </span>
              </div>
            </>
          ) : (
            <ListView selected={selected} onSelect={select} pathNodes={path.nodes} />
          )}
        </div>

        <div ref={panelRef} className="panel" role="region" aria-live="polite" aria-label="Details">
          {(selected || scenarioId) && (
            <p className="only-narrow small" style={{ marginTop: 0 }}>
              <a href="#explorer-top">Back to the elements</a>
            </p>
          )}
          {scenario && step ? (
            <JourneyPanel
              scenario={scenario}
              step={step}
              index={journey!}
              total={steps.length}
              order={order}
              onMove={(i) => setJourney(i)}
              onExit={() => setJourney(null)}
            />
          ) : scenario ? (
            <ScenarioPanel scenario={scenario} pathNodes={path.nodes} onSelect={select} selected={selected} />
          ) : selected ? (
            <NodePanel id={selected} onSelect={select} onScenario={setScenarioId} />
          ) : (
            <IntroPanel />
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ panels

function NodeLink({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  const n = nodesById.get(id);
  if (!n) return <span className="mono">{id}</span>;
  return (
    <button type="button" className="linklike" onClick={() => onSelect(id)}>
      {n.name}
    </button>
  );
}

function JourneyPanel({
  scenario,
  step,
  index,
  total,
  order,
  onMove,
  onExit,
}: {
  scenario: Scenario;
  step: JourneyStep;
  index: number;
  total: number;
  order: string[];
  onMove: (i: number) => void;
  onExit: () => void;
}) {
  const fullPath = new Set(order);
  const safeguards = caseData.safeguards.filter((s) => scenario.safeguards.includes(s.id));
  const controls = [...new Set(safeguards.flatMap((s) => s.controls))];
  const gates = new Set<string>();
  for (const c of controls) for (const g of caseData.controls[c]?.gates ?? []) gates.add(g.gate);
  const gateStates = caseData.gateResults.filter((g) => gates.has(g.gate));
  const d = caseData.decision;
  const sc = caseData.score;
  // The gates named in the controlling reasons, with the critical controls that held them back.
  const trace = [...new Set(d.controllingReasons.flatMap((r) => r.match(/CG-\d+/g) ?? []))].map((gid) => {
    const g = caseData.gateResults.find((x) => x.gate === gid)!;
    const crit = g.evaluations.filter((e) => e.role === "CRITICAL");
    return {
      gate: gid,
      state: g.state,
      weak: crit.filter((e) => !["CONFORMING", "NOT_ASSESSED"].includes(e.result)),
      notAssessed: crit.filter((e) => e.result === "NOT_ASSESSED").length,
      unknowns: caseData.unknowns.filter((u) => u.constrains.includes(gid)),
    };
  });

  let body: React.ReactNode;
  if (step.kind === "node") {
    const n = nodesById.get(step.id)!;
    const from = scenario.steps.filter((st) => st.to === n.id).map((st) => nodesById.get(st.from)?.name ?? st.from);
    const onward = scenario.steps.filter((st) => st.from === n.id).map((st) => nodesById.get(st.to)?.name ?? st.to);
    const initiators = caseData.initiators.filter((i) => scenario.initiatedBy.includes(i.id));
    const fds = caseData.faultDomains.filter((f) => f.members.includes(n.id) && f.members.filter((m) => fullPath.has(m)).length >= 2);
    const effect = scenario.effects.find((e) => e.outcome === n.id);
    const outcome = caseData.outcomes.find((o) => o.id === n.id);
    const unknowns = caseData.unknowns.filter((u) => u.subject === n.id || n.unknowns.includes(u.id));
    body = (
      <>
        <p className="eyebrow" style={{ margin: 0 }}>
          {layerOf(n)}
          {n.domain ? ` · domain ${n.domain}` : ""}
        </p>
        <h3>{n.name}</h3>
        {n.detail && n.detail !== n.name && <p className="small">{/^[A-Z_]+$/.test(n.detail) ? humanise(n.detail) : n.detail.replace(/^Illustrative: /, "")}</p>}
        {from.length === 0 ? (
          <p>
            <strong>The failure starts here.</strong>{" "}
            {initiators.map((i) => `${humanise(i.type)}: ${i.name}`).join("; ")}.
          </p>
        ) : (
          <p>
            <strong>Failure arrives from</strong> {from.join(" and ")}.
          </p>
        )}
        {onward.length > 0 && (
          <p>
            <strong>It passes on to</strong> {onward.join(" and ")}.
          </p>
        )}
        {effect && (
          <p className="notice small">
            <strong>Outcome effect.</strong> {effect.effect.replace(/^Illustrative: /, "")}
            {outcome ? ` Tolerance: ${outcome.tolerance.replace(/^Illustrative: /, "")}.` : ""}
          </p>
        )}
        {fds.map((fd) => (
          <p key={fd.id} className="notice small">
            <strong>Shared fault domain {fd.id}.</strong> {fd.commonMode} {fd.blastRadius}
          </p>
        ))}
        {unknowns.map((u) => (
          <p key={u.id} className="small">
            <span className="state s-unknown">
              {u.id} {u.severity}
            </span>{" "}
            {u.reason}
          </p>
        ))}
      </>
    );
  } else if (step.kind === "safeguards") {
    body = (
      <>
        <p className="eyebrow" style={{ margin: 0 }}>
          Safeguards
        </p>
        <h3>What should have stopped it</h3>
        <ul>
          {safeguards.map((s) => {
            const compromised = s.dependsOn.filter((x) => fullPath.has(x));
            return (
              <li key={s.id}>
                <strong>{s.name}</strong> <span className="muted small">({humanise(s.activation)})</span>
                {compromised.length > 0 && (
                  <div className="small" style={{ color: "var(--fail)" }}>
                    Depends on {compromised.map((x) => nodesById.get(x)?.name ?? x).join(", ")}, which is on this failure
                    path, so it cannot be relied on here.
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </>
    );
  } else if (step.kind === "controls") {
    body = (
      <>
        <p className="eyebrow" style={{ margin: 0 }}>
          Controls and evidence
        </p>
        <h3>What the evidence showed</h3>
        <p className="small">
          Each safeguard is governed by controls. Here is what the assessment found for each, and the evidence it
          rested on:
        </p>
        <ul>
          {controls.map((c) => (
            <ControlLine key={c} id={c} />
          ))}
        </ul>
      </>
    );
  } else if (step.kind === "gates") {
    body = (
      <>
        <p className="eyebrow" style={{ margin: 0 }}>
          Critical gates
        </p>
        <h3>Where the results are judged</h3>
        <p className="small">Control results roll up into critical gates. A gate does not average; one weak critical control holds it back.</p>
        <ul>
          {gateStates.map((g) => (
            <li key={g.gate}>
              <span className="mono">{g.gate}</span> {gateName(g.gate)} <span className={resultClass(g.state)}>{g.state}</span>
              <div className="small muted">{g.decisionEffect}</div>
            </li>
          ))}
        </ul>
      </>
    );
  } else {
    body = (
      <>
        <p className="eyebrow" style={{ margin: 0 }}>
          Assurance decision
        </p>
        <h3>
          <span className={resultClass(d.state)}>{d.state}</span>
        </h3>
        <p className="small">
          <strong>Controlling reason:</strong> {d.controllingReasons.join("; ")}. The most restrictive ceiling across all
          gates and UNKNOWNs decides, not this scenario alone.
        </p>
        {trace.map((t) => (
          <div key={t.gate} className="trace">
            <h4>
              Traced back: {t.gate} {gateName(t.gate)} <span className={resultClass(t.state)}>{t.state}</span>
            </h4>
            <ul>
              {t.weak.map((e) => {
                const c = caseData.controls[e.control];
                const have = new Set(c?.evidence.map((x) => x.class) ?? []);
                const missing = (c?.requiredClasses ?? []).filter((x) => !have.has(x));
                return (
                  <li key={e.control} className="small">
                    <span className="mono">{e.control}</span> {c?.title}{" "}
                    <span className="muted">({e.role.toLowerCase()})</span> <span className={resultClass(e.result)}>{e.result}</span>
                    {c?.findings.map((fid) => {
                      const f = caseData.findings.find((x) => x.id === fid);
                      return f ? (
                        <div key={fid}>
                          {f.id}: {f.condition}
                        </div>
                      ) : null;
                    })}
                    {missing.length > 0 && <div>Missing evidence: {missing.join(", ")}.</div>}
                  </li>
                );
              })}
              {t.notAssessed > 0 && (
                <li className="small muted">
                  {t.notAssessed} further critical control{t.notAssessed === 1 ? " was" : "s were"} not assessed.
                </li>
              )}
            </ul>
            {t.unknowns.map((u) => (
              <p key={u.id} className="small">
                <span className="state s-unknown">
                  {u.id} {u.severity}
                </span>{" "}
                {u.name}. Evidence needed: {u.evidenceNeeded}
              </p>
            ))}
          </div>
        ))}
        <p className="small">
          {sc.coverage.assessedCount} of {sc.coverage.inScopeCount} controls assessed; coverage{" "}
          {percent(sc.coverage.coveragePercent, 2)}; score band {sc.band}.
        </p>
        <p className="small muted">Synthetic demonstration. It shows how the method reasons; it is not an assurance claim about any facility.</p>
        <p className="small">
          <a href="#decision-h">Read the full decision</a>
        </p>
      </>
    );
  }

  return (
    <>
      <p className="small muted" style={{ marginTop: 0 }}>
        Guided journey · {scenario.id} {scenario.name} · step {index + 1} of {total}
      </p>
      <div className="journey-bar" aria-hidden="true">
        <span style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
      <ol className="journey-path only-narrow" aria-label="Failure path">
        {order.map((id, i) => {
          const reachedHere = step.kind !== "node" || i <= order.indexOf(step.id);
          const isCurrent = step.kind === "node" && step.id === id;
          return (
            <li key={id} className={isCurrent ? "current" : reachedHere ? "reached" : undefined} aria-current={isCurrent ? "step" : undefined}>
              {nodesById.get(id)?.domain && <span className="mono">{nodesById.get(id)?.domain} </span>}
              {nodesById.get(id)?.name ?? id}
            </li>
          );
        })}
      </ol>
      {body}
      <div className="journey-nav">
        <button type="button" className="btn" disabled={index === 0} onClick={() => onMove(index - 1)}>
          ← Back
        </button>
        {index < total - 1 ? (
          <button type="button" className="btn primary" onClick={() => onMove(index + 1)}>
            Next →
          </button>
        ) : (
          <button type="button" className="btn primary" onClick={onExit}>
            Finish
          </button>
        )}
        <button type="button" className="linklike small" onClick={onExit}>
          Exit
        </button>
      </div>
    </>
  );
}

function IntroPanel() {
  const c = caseData.capability;
  return (
    <>
      <h3>{c.name}</h3>
      <p className="muted small">Synthetic. Describes no real facility.</p>
      <p>{c.boundary}</p>
      <p className="small">{c.demandProfile}</p>
      <h4>How to use this</h4>
      <ul>
        <li>Select any box to see what it relies on, what relies on it, and what can go wrong.</li>
        <li>
          Start the <strong>guided journey</strong> to walk one failure step by step, from the plant through the AI
          systems to the evidence, the gates and the decision.
        </li>
        <li>Choose a failure scenario to trace it from its origin to the service outcome it breaks.</li>
        <li>
          Boxes marked <strong>UNKNOWN</strong> carry unresolved evidence gaps that cap the decision.
        </li>
      </ul>
    </>
  );
}

const sLevel = (s: string | null) => (s ? Number(s.replace(/\D/g, "")) : -1);

// What the assessment of one control rested on: evidence objects, tests and samples, and the gap to its profile.
export function EvidenceBlock({ id, open = false }: { id: string; open?: boolean }) {
  const c = caseData.controls[id];
  if (!c) return null;
  if (c.result === "NOT_ASSESSED") {
    return <div className="small muted">Not assessed: no evidence was collected, so this control cannot support its gates.</div>;
  }
  const have = new Set(c.evidence.map((e) => e.class));
  const missing = c.requiredClasses.filter((x) => !have.has(x));
  const belowFloor = sLevel(c.sufficiency) < sLevel(c.floor);
  const ev = caseData.evidenceClasses;
  const gaps = [
    ...missing.map((x) => `missing ${x} ${ev[x] ?? ""}`.trim()),
    ...(belowFloor ? [`${c.sufficiency} below the ${c.floor} floor`] : []),
  ];
  return (
    <div className="evidence-block">
      <p className={`small ev-gap ${gaps.length ? "has-gap" : "no-gap"}`}>
        {gaps.length ? (
          <>
            <strong>Evidence gap:</strong> {gaps.join("; ")}.
          </>
        ) : (
          <>
            <strong>No evidence gap:</strong> all required classes present at {c.sufficiency ?? "unrated"}
            {c.floor ? `, floor ${c.floor}` : ""}.
          </>
        )}
      </p>
      <details className="evidence" open={open}>
        <summary className="small">
          Evidence detail: {c.evidence.length} object{c.evidence.length === 1 ? "" : "s"}
          {c.tests.length ? ` and ${c.tests.length} test${c.tests.length === 1 ? "" : "s"}` : ""}
        </summary>
        <div className="small">
          <p>Required classes: {c.requiredClasses.map((x) => `${x} ${ev[x] ?? ""}`.trim()).join("; ")}.</p>
        {c.methods.length > 0 && <p>Methods: {c.methods.map((m) => humanise(m).toLowerCase()).join(", ")}.</p>}
        <ul>
          {c.evidence.map((e) => (
            <li key={e.id}>
              <span className="mono">{e.id}</span> {e.class} {ev[e.class] ?? ""} · {e.sufficiency} · quality {e.quality}
              {e.period ? ` · ${e.period}` : ""}
              {e.states.length ? ` · ${e.states.join(", ")}` : ""}
              {e.sha256 && (
                <div className="muted">
                  SHA-256 <span className="mono">{e.sha256.slice(0, 16)}…</span>
                  {e.fixture && (
                    <>
                      {" "}
                      <a href={sourceUrl(e.fixture)}>
                        fixture<span className="visually-hidden"> {e.id}</span>
                      </a>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
          {c.tests.map((t) => (
            <li key={t.id}>
              <span className="mono">{t.id}</span> {humanise(t.type)}: {t.name}
              {t.outcome ? ` (${t.outcome.replace(/^Synthetic: /, "")})` : ""}
            </li>
          ))}
        </ul>
        </div>
      </details>
    </div>
  );
}

function ControlLine({ id, evidenceOpen = false }: { id: string; evidenceOpen?: boolean }) {
  const c = caseData.controls[id];
  if (!c) return <li className="mono">{id}</li>;
  return (
    <li>
      <span className="mono">{c.id}</span> {c.title} <span className={resultClass(c.result)}>{c.result}</span>
      {c.gates.length > 0 && (
        <div className="small muted">
          Feeds{" "}
          {c.gates.map((g, i) => (
            <span key={g.gate}>
              {i > 0 ? ", " : ""}
              {g.gate} ({g.role.toLowerCase()})
            </span>
          ))}
        </div>
      )}
      {c.rationale && <div className="small">{c.rationale}</div>}
      <EvidenceBlock id={id} open={evidenceOpen} />
      {c.findings.map((fid) => {
        const f = caseData.findings.find((x) => x.id === fid);
        return f ? (
          <div key={fid} className="small">
            <strong>
              {f.id} {humanise(f.class)}:
            </strong>{" "}
            {f.condition} <span className="muted">{f.gateEffect}</span>
          </div>
        ) : null;
      })}
    </li>
  );
}

function ScenarioPanel({
  scenario,
  pathNodes,
  onSelect,
  selected,
}: {
  scenario: (typeof caseData.scenarios)[number];
  pathNodes: Set<string>;
  onSelect: (id: string) => void;
  selected: string | null;
}) {
  const initiators = caseData.initiators.filter((i) => scenario.initiatedBy.includes(i.id));
  const order: string[] = [];
  for (const st of scenario.steps) {
    if (!order.includes(st.from)) order.push(st.from);
    if (!order.includes(st.to)) order.push(st.to);
  }
  const safeguards = caseData.safeguards.filter((s) => scenario.safeguards.includes(s.id));
  const domainsHit = caseData.faultDomains.filter((fd) => fd.members.filter((m) => pathNodes.has(m)).length >= 2);
  const gatesTouched = new Set<string>();
  for (const s of safeguards) for (const c of s.controls) for (const g of caseData.controls[c]?.gates ?? []) gatesTouched.add(g.gate);
  const gateStates = caseData.gateResults.filter((g) => gatesTouched.has(g.gate));

  return (
    <>
      <p className="eyebrow" style={{ margin: 0 }}>
        Failure scenario {scenario.id}
      </p>
      <h3>{scenario.name}</h3>
      {scenario.library && (
        <p className="small">
          From library scenario{" "}
          <a href={`/scenarios/#${scenario.library}`} className="mono">
            {scenario.library}
          </a>{" "}
          of AIDCF-004, traced through this case. {scenario.note}
        </p>
      )}
      {initiators.map((i) => (
        <p key={i.id} className="small">
          <strong>{humanise(i.type)}:</strong> {i.name}
          {i.mechanism ? `. ${/^[A-Z_]+$/.test(i.mechanism) ? humanise(i.mechanism) : i.mechanism}` : ""}.
        </p>
      ))}
      <p className="small">
        Starts in <span className="mono">{scenario.preState}</span>; without its safeguards it leaves the capability{" "}
        <span className="mono">{scenario.residualState}</span>.
      </p>

      <h4>How it propagates</h4>
      <ol className="path-steps">
        {order.map((id) => (
          <li key={id}>
            {selected === id ? <strong>{nodesById.get(id)?.name ?? id}</strong> : <NodeLink id={id} onSelect={onSelect} />}
          </li>
        ))}
      </ol>
      {scenario.effects.map((e) => (
        <p key={e.outcome} className="small">
          <strong>{nodesById.get(e.outcome)?.name}:</strong> {e.effect.replace(/^Illustrative: /, "")}
        </p>
      ))}

      {domainsHit.map((fd) => (
        <p key={fd.id} className="notice small">
          <strong>Common-mode failure ({fd.id}).</strong> {fd.commonMode} {fd.blastRadius}
        </p>
      ))}

      <h4>Safeguards expected to stop it</h4>
      <ul>
        {safeguards.map((s) => {
          const compromised = s.dependsOn.filter((d) => pathNodes.has(d));
          return (
            <li key={s.id}>
              <strong>{s.name}</strong>{" "}
              <span className="muted small">
                ({humanise(s.activation)}; trigger: {s.trigger})
              </span>
              {compromised.length > 0 && (
                <div className="small" style={{ color: "var(--fail)" }}>
                  Depends on {compromised.map((d) => nodesById.get(d)?.name ?? d).join(", ")}, which is on this failure
                  path, so it cannot be relied on here.
                </div>
              )}
              <ul>
                {s.controls.map((c) => (
                  <ControlLine key={c} id={c} />
                ))}
              </ul>
            </li>
          );
        })}
      </ul>

      {gateStates.length > 0 && (
        <>
          <h4>Gates these controls feed</h4>
          <ul>
            {gateStates.map((g) => (
              <li key={g.gate}>
                <span className="mono">{g.gate}</span> {gateName(g.gate)}{" "}
                <span className={resultClass(g.state)}>{g.state}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {scenario.restricted && (
        <p className="small muted">This scenario carries a distribution restriction in the dataset, as a real security scenario would.</p>
      )}
    </>
  );
}

function NodePanel({
  id,
  onSelect,
  onScenario,
}: {
  id: string;
  onSelect: (id: string) => void;
  onScenario: (id: string) => void;
}) {
  const n = nodesById.get(id)!;
  const incoming = caseData.edges.filter((e) => e.to === id);
  const outgoing = caseData.edges.filter((e) => e.from === id);
  const fds = caseData.faultDomains.filter((f) => f.members.includes(id));
  const initiators = caseData.initiators.filter((i) => i.exposed.includes(id));
  const scenarios = caseData.scenarios.filter((s) => s.steps.some((st) => st.from === id || st.to === id));
  const safeguards = caseData.safeguards.filter((s) => s.implementedBy.includes(id) || s.dependsOn.includes(id));
  const unknowns = caseData.unknowns.filter((u) => u.subject === id || n.unknowns.includes(u.id));
  const outcome = caseData.outcomes.find((o) => o.id === id);

  return (
    <>
      <p className="eyebrow" style={{ margin: 0 }}>
        {humanise(n.type)} {n.domain ? `· domain ${n.domain}` : ""}
      </p>
      <h3>{n.name}</h3>
      <p className="mono small muted">{n.id}</p>
      {n.detail && <p>{/^[A-Z_]+$/.test(n.detail) ? humanise(n.detail) : n.detail.replace(/^Illustrative: /, "")}</p>}
      {outcome && (
        <p className="small">
          <strong>Tolerance:</strong> {outcome.tolerance.replace(/^Illustrative: /, "")}
        </p>
      )}

      {incoming.length > 0 && (
        <>
          <h4>Relies on</h4>
          <ul>
            {incoming.map((e) => (
              <li key={edgeKey(e)}>
                <NodeLink id={e.from} onSelect={onSelect} />{" "}
                <span className="muted small">
                  ({e.kind === "depends" ? humanise(e.label) + " dependency" : edgeVerb[e.kind][1]})
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      {outgoing.length > 0 && (
        <>
          <h4>Relied on by</h4>
          <ul>
            {outgoing.map((e) => (
              <li key={edgeKey(e)}>
                <NodeLink id={e.to} onSelect={onSelect} />{" "}
                <span className="muted small">({e.kind === "depends" ? humanise(e.label) + " dependency" : edgeVerb[e.kind][0]})</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {fds.map((fd) => (
        <p key={fd.id} className="notice small">
          <strong>Shared fault domain {fd.id}.</strong> {fd.commonMode} {fd.blastRadius}
        </p>
      ))}
      {initiators.length > 0 && (
        <>
          <h4>Exposed to</h4>
          <ul>
            {initiators.map((i) => (
              <li key={i.id}>
                {i.name} <span className="muted small">({humanise(i.type)})</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {scenarios.length > 0 && (
        <>
          <h4>Failure scenarios through this element</h4>
          <ul>
            {scenarios.map((s) => (
              <li key={s.id}>
                <button type="button" className="linklike" onClick={() => onScenario(s.id)}>
                  {s.id}: {s.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {safeguards.length > 0 && (
        <>
          <h4>Safeguards</h4>
          <ul>
            {safeguards.map((s) => (
              <li key={s.id}>
                <strong>{s.name}</strong>{" "}
                <span className="muted small">
                  {s.implementedBy.includes(id) ? "implemented here" : "depends on this element"}
                </span>
                <ul>
                  {s.controls.map((c) => (
                    <ControlLine key={c} id={c} />
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
      {unknowns.length > 0 && (
        <>
          <h4>UNKNOWN records</h4>
          <ul>
            {unknowns.map((u) => (
              <li key={u.id}>
                <span className="state s-unknown">
                  {u.id} {u.severity}
                </span>{" "}
                {u.reason} <span className="small muted">{u.decisionEffect}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function ListView({
  selected,
  onSelect,
  pathNodes,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
  pathNodes: Set<string>;
}) {
  return (
    <div className="list-view">
      {[...COLS].reverse().map((c) => {
        const list = caseData.nodes.filter((n) => n.kind === c.kind);
        return (
          <div key={c.kind}>
            <h3>{c.label}</h3>
            <ul>
              {list.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    aria-pressed={selected === n.id}
                    className={pathNodes.has(n.id) ? "on-path" : undefined}
                    onClick={() => onSelect(n.id)}
                  >
                    <span className="mono small muted">
                      {n.id}
                      {n.domain ? ` · ${n.domain}` : ""}
                    </span>{" "}
                    {n.name}
                    {n.unknowns.length > 0 && <span className="state s-unknown" style={{ marginLeft: 8 }}>UNKNOWN</span>}
                    {pathNodes.has(n.id) && <span className="visually-hidden"> (on the failure path)</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
