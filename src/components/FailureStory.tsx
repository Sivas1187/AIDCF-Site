import Link from "next/link";
import { caseData, gateName, humanise, type CaseNode } from "@/lib/data";
import { layerLabel, nodeName, story } from "@/lib/story";

const resultClass = (r: string) => `state s-${r.toLowerCase()}`;
const plain = (s: string | null | undefined) => (s ?? "").replace(/^Illustrative: /, "");

// Nodes in the AI technology chain, and the service function and outcome, are the impact; the rest is the failure.
const isImpact = (n: CaseNode) =>
  n.kind === "function" || n.kind === "outcome" || layerLabel(n) === "AI technology chain";

function Chain({ nodes }: { nodes: CaseNode[] }) {
  return (
    <ol className="story-chain">
      {nodes.map((n) => (
        <li key={n.id} className={n.unknowns.length ? "has-unknown" : undefined}>
          <span className="story-layer">{layerLabel(n)}</span>
          <span className="story-node">{n.name}</span>
          {n.unknowns.length > 0 && <span className="story-flag">UNKNOWN {n.unknowns.join(", ")}</span>}
        </li>
      ))}
    </ol>
  );
}

/**
 * The FS-04 failure told in four stages. `variant="hero"` is the compact
 * picture on the homepage; `variant="board"` adds a fold-out detail to each
 * stage for the case page.
 */
export function FailureStory({ variant }: { variant: "hero" | "board" }) {
  const s = story;
  const board = variant === "board";
  const failure = s.path.filter((n) => !isImpact(n));
  const impact = s.path.filter(isImpact);
  const hazard = s.hazards[0];
  const b = s.bridge[0];
  const unknown = s.pathUnknowns[0];

  return (
    <figure className={`story story-${variant}`} aria-labelledby={`story-${variant}-h`}>
      <figcaption id={`story-${variant}-h`} className="story-cap">
        <span className="story-tag">Synthetic example</span> One failure, traced from the water supply to the decision:{" "}
        <span className="mono">{s.scenario.id}</span> {s.scenario.name}
      </figcaption>
      <ol className="story-stages">
        <li className="story-stage">
          <p className="story-head">
            <span className="story-num">01</span> Failure
          </p>
          <p className="story-lead">{hazard ? <>{hazard.name}.</> : null} The cooling chain loses capacity.</p>
          <Chain nodes={failure} />
          {board && (
            <details>
              <summary>Origin and path</summary>
              {hazard && (
                <p className="small">
                  <span className="mono">{hazard.id}</span> {hazard.name} ({humanise(hazard.mechanism).toLowerCase()}{" "}
                  {humanise(hazard.type).toLowerCase()}). Directly exposed: {hazard.exposed.map(nodeName).join(", ")}.
                </p>
              )}
              <p className="small">
                The failure starts in {s.scenario.preState} operation and propagates through {s.scenario.steps.length}{" "}
                recorded steps. Analysis confidence {s.scenario.confidence}.
              </p>
            </details>
          )}
        </li>

        <li className="story-stage">
          <p className="story-head">
            <span className="story-num">02</span> Impact
          </p>
          <p className="story-lead">
            Accelerators lose cooling, so {s.outcome ? s.outcome.name.toLowerCase() : "the service"}{" "}
            {s.effect?.exceedsTolerance ? "breaches its tolerance" : "is affected"}.
          </p>
          <Chain nodes={impact} />
          <p className="small story-meta">
            Ends <span className={resultClass(s.scenario.residualState)}>{s.scenario.residualState}</span>
          </p>
          {board && (
            <details>
              <summary>Service outcome</summary>
              {s.outcome && (
                <p className="small">
                  <span className="mono">{s.outcome.id}</span> {s.outcome.name}: {plain(s.outcome.measure)}, tolerance{" "}
                  {plain(s.outcome.tolerance)}. Applies in {s.outcome.states.join(" and ")}.
                </p>
              )}
              {s.effect && <p className="small">{s.effect.effect}</p>}
            </details>
          )}
        </li>

        <li className="story-stage">
          <p className="story-head">
            <span className="story-num">03</span> Evidence
          </p>
          <p className="story-lead">The safeguards that should contain it are not shown to work.</p>
          <ul className="story-chain story-evidence">
            {s.safeguards.map((g) => (
              <li key={g.id}>
                <span className="story-node">{g.name}</span>
                {g.results.map((c) => (
                  <span key={c.id} className="story-ctl">
                    <span className="mono">{c.id.replace(/^MCF-/, "")}</span> {c.title}{" "}
                    <span className={resultClass(c.result)}>{humanise(c.result)}</span>
                  </span>
                ))}
              </li>
            ))}
            {unknown && (
              <li className="has-unknown">
                <span className="story-node">{unknown.name}</span>
                <span className="story-flag">
                  UNKNOWN {unknown.id}, severity {unknown.severity}
                </span>
              </li>
            )}
          </ul>
          {board && (
            <details>
              <summary>Findings and unknowns</summary>
              {s.findings.map((f) => (
                <p key={f.id} className="small">
                  <span className="mono">{f.id}</span> on <span className="mono">{f.control}</span>: {f.condition}{" "}
                  {f.consequence}
                </p>
              ))}
              {s.pathUnknowns.map((u) => (
                <p key={u.id} className="small">
                  <span className="mono">{u.id}</span> on {nodeName(u.subject)}: {u.reason} Needed: {u.evidenceNeeded}
                </p>
              ))}
            </details>
          )}
        </li>

        <li className="story-stage story-decision">
          <p className="story-head">
            <span className="story-num">04</span> Decision
          </p>
          <p className="story-state">
            <span className={resultClass(s.decision.state)}>{humanise(s.decision.state)}</span>
          </p>
          {b && s.gate ? (
            <p className="story-lead">
              {b.control.title} is a critical input to {s.gate} {gateName(s.gate)}. A{" "}
              {humanise(b.control.result).toLowerCase()} result fails the gate, and a failed gate caps the decision
              however good the rest is.
            </p>
          ) : (
            <p className="story-lead">Controlled by {s.decision.controllingReasons.join("; ")}.</p>
          )}
          {board && s.gateResult && (
            <details>
              <summary>Why the gate fails</summary>
              <p className="small">
                {s.gate} has {s.gateResult.evaluations.filter((e) => e.role === "CRITICAL").length} critical controls.
                Under the AIDCF-010 roll-up rule a PARTIAL result never lets a gate pass.
              </p>
              <ul className="small plain">
                {s.weakCritical.map((e) => (
                  <li key={e.control}>
                    <span className="mono">{e.control}</span> {caseData.controls[e.control]?.title ?? ""}{" "}
                    <span className={resultClass(e.result)}>{humanise(e.result)}</span>
                  </li>
                ))}
              </ul>
              <p className="small">
                <a href="#gates-h">All gate results</a>
              </p>
            </details>
          )}
        </li>
      </ol>
      <p className="story-foot">
        {board ? (
          <a className="btn primary" href="#journey">
            Walk through it step by step
          </a>
        ) : (
          <Link className="btn primary" href="/case/#journey">
            Follow this failure step by step
          </Link>
        )}
        <span className="small muted">Drawn from the AIDCF-015 synthetic dataset. It describes no real facility.</span>
      </p>
    </figure>
  );
}
