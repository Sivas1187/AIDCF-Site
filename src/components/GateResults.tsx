"use client";

import { useState } from "react";
import { caseData, framework, gateName, humanise } from "@/lib/data";
import { EvidenceBlock } from "./CaseExplorer";

const resultClass = (r: string) => `state s-${r.toLowerCase()}`;

export function GateResults() {
  const [gate, setGate] = useState<string>(caseData.summary.fail[0] ?? caseData.gateResults[0].gate);
  const g = caseData.gateResults.find((x) => x.gate === gate)!;
  const def = framework.gates.find((x) => x.id === gate);
  const unknowns = caseData.unknowns.filter((u) => u.constrains.includes(gate));
  const findings = caseData.findings.filter((f) => g.findings.includes(f.id));
  const assessed = g.evaluations.filter((e) => e.result !== "NOT_ASSESSED");
  const notAssessed = g.evaluations.length - assessed.length;
  const criteria = g.criteria.reduce<Record<string, number>>((acc, c) => {
    acc[c.outcome] = (acc[c.outcome] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="gate-grid" role="group" aria-label="Gate results">
        {caseData.gateResults.map((r) => (
          <button
            key={r.gate}
            type="button"
            className={`gate-cell st-${r.state}`}
            aria-pressed={r.gate === gate}
            aria-controls="gate-detail"
            onClick={() => setGate(r.gate)}
          >
            <span className="mono">{r.gate}</span>
            <span className="gname">{gateName(r.gate)}</span>
            <span>
              <span className={resultClass(r.state)}>{r.state}</span>
            </span>
          </button>
        ))}
      </div>

      <div id="gate-detail" className="card" style={{ marginTop: 16 }} aria-live="polite">
        <p className="eyebrow" style={{ margin: 0 }}>
          {g.gate} · {humanise(g.applicability)}
          {g.sufficiency ? ` · evidence sufficiency ${g.sufficiency}` : ""}
        </p>
        <h3>
          {gateName(g.gate)} <span className={resultClass(g.state)}>{g.state}</span>
        </h3>
        {def && <p className="small muted">{def.scope}</p>}
        <p>
          <strong>Why:</strong> {g.rationale}
        </p>
        <p>
          <strong>Effect on the decision:</strong> {g.decisionEffect}
        </p>
        {assessed.length > 0 && (
          <>
            <h4 className="small muted" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Assessed controls
            </h4>
            <ul>
              {assessed.map((e) => (
                <li key={e.control}>
                  <span className="mono">{e.control}</span> {caseData.controls[e.control]?.title}{" "}
                  <span className="muted small">({e.role.toLowerCase()})</span>{" "}
                  <span className={resultClass(e.result)}>{e.result}</span>
                  <EvidenceBlock id={e.control} />
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="small">
          {g.evaluations.length > 0
            ? `${notAssessed} of ${g.evaluations.length} mapped controls were not assessed. `
            : "This is a meta-gate evaluated on criteria rather than controls. "}
          {Object.entries(criteria)
            .map(([k, v]) => `${v} ${v === 1 ? "criterion" : "criteria"} ${humanise(k).toLowerCase()}`)
            .join(", ")}
          .
        </p>
        {findings.map((f) => (
          <p key={f.id} className="small">
            <strong>
              {f.id} ({humanise(f.class)}, {f.control}):
            </strong>{" "}
            {f.condition} {f.consequence}
          </p>
        ))}
        {unknowns.map((u) => (
          <p key={u.id} className="notice small">
            <strong>
              {u.id} ({u.severity}): {u.name}.
            </strong>{" "}
            {u.decisionEffect}
          </p>
        ))}
      </div>
    </div>
  );
}
