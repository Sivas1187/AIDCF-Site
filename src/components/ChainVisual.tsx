"use client";

import { useState } from "react";
import { framework, sourceUrl } from "@/lib/data";

// The simplified chain shown on the homepage. Each stage lists the canonical
// AIDCF-002 steps it summarises; the step names and questions are read from
// the generated data, so the simplification can never contradict the source.
const stages: { title: string; sub: string; steps: string[]; key?: boolean; tiles?: "domains" | "decisions" }[] = [
  { title: "Decision question", sub: "Which decision relies on this, and who makes it?", steps: ["1"] },
  { title: "Capability instance", sub: "A bounded subject, for example one AI training cluster, not a whole site", steps: ["2"], key: true },
  { title: "Service outcomes and required functions", sub: "What it must achieve, within which tolerances", steps: ["3", "4"] },
  { title: "Architecture", sub: "The systems, assets and interfaces that deliver each function, as built", steps: ["5"], tiles: "domains" },
  { title: "Dependencies and fault domains", sub: "What each element relies on, and what fails together", steps: ["6"], key: true },
  { title: "Failure scenarios and safeguards", sub: "How the outcome can be defeated, and what prevents, detects or recovers", steps: ["7", "8"] },
  { title: "Controls and evidence", sub: "The requirements that test the safeguards, and the evidence obtained", steps: ["9", "10", "11"] },
  { title: "Findings and UNKNOWNs", sub: "Deficiencies and unresolved uncertainty stay visible and cap the decision", steps: ["12", "13"], key: true },
  { title: "Gate results", sub: "15 non-compensating critical gates: strong scores elsewhere cannot offset a failure", steps: ["14"], key: true },
  { title: "Assurance decision", sub: "A bounded conclusion made by an accountable person", steps: ["15", "16"], key: true, tiles: "decisions" },
];

const shownDomains = ["CMP", "NET", "STO", "POW", "THM", "SEC"];

export function ChainVisual() {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const allOpen = open.size === stages.length;
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const step = (n: string) => framework.chain.find((s) => s.step === n);
  const loop = framework.chain.find((s) => s.step === "Loop");

  return (
    <figure style={{ margin: 0 }}>
      <div className="toolbar" style={{ justifyContent: "space-between" }}>
        <span className="muted small">Select a stage to see the canonical steps it summarises.</span>
        <button
          type="button"
          className="btn"
          onClick={() => setOpen(allOpen ? new Set() : new Set(stages.map((_, i) => i)))}
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <ol className="chain" aria-label="AIDCF assurance chain, simplified">
        {stages.map((s, i) => {
          const expanded = open.has(i);
          const id = `chain-stage-${i}`;
          return (
            <li key={s.title} className={s.key ? "key" : undefined}>
              <span className="chain-dot" aria-hidden="true" />
              <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => toggle(i)}>
                <span className="chain-title">
                  {s.title}
                  <span className="mono muted small">
                    step{s.steps.length > 1 ? "s" : ""} {s.steps[0]}
                    {s.steps.length > 1 ? `–${s.steps[s.steps.length - 1]}` : ""}
                  </span>
                </span>
                <span className="chain-sub">{s.sub}</span>
                {s.tiles === "domains" && (
                  <span className="chain-tiles">
                    {shownDomains.map((code) => (
                      <span
                        key={code}
                        className="tile"
                        title={framework.domains.find((d) => d.id === code)?.name}
                      >
                        {code}
                      </span>
                    ))}
                    <span className="tile">+ {framework.domains.length - shownDomains.length} more domains</span>
                  </span>
                )}
                {s.tiles === "decisions" && (
                  <span className="chain-tiles">
                    {framework.decisionStates.map((d) => (
                      <span key={d.code} className="tile">
                        {d.code}
                      </span>
                    ))}
                  </span>
                )}
              </button>
              <div id={id} className="chain-detail" hidden={!expanded}>
                <ol>
                  {s.steps.map((n) => {
                    const c = step(n);
                    return c ? (
                      <li key={n} value={Number(n)}>
                        <strong>{c.name}.</strong> {c.question}{" "}
                        <span className="muted mono small">({c.owner})</span>
                      </li>
                    ) : null;
                  })}
                </ol>
              </div>
            </li>
          );
        })}
      </ol>
      <figcaption className="caption">
        Simplified view. The canonical chain has {framework.chain.filter((s) => s.step !== "Loop").length} steps
        and is authoritative in{" "}
        <a href={sourceUrl(framework.chainSource)}>AIDCF-002 Core Conceptual Model</a>.
        {loop ? ` ${loop.name}: ${loop.question}` : ""} It is built forwards to discover what matters and audited
        backwards to check that every part of the decision is supported.
      </figcaption>
    </figure>
  );
}
