import type { Metadata } from "next";
import Link from "next/link";
import { ScenarioFilter } from "@/components/ScenarioFilter";
import { caseData, framework, gateName, sourceUrl } from "@/lib/data";
import { scenarioLibrary } from "@/lib/scenarios";

export const metadata: Metadata = {
  title: "Failure scenario library",
  description:
    "The twenty AIDCF-004 cross-domain failure scenarios for AI data centres: initiating event, propagation path, affected service outcomes, safeguards, critical gates and the evidence that would show the safeguards work.",
};

const STATE_ORDER = ["NORMAL", "MAINTENANCE", "DEGRADED", "EMERGENCY", "FAILED", "RECOVERY", "ISOLATED"];

export default function ScenariosPage() {
  const lib = scenarioLibrary.scenarios;
  const used = new Set(lib.flatMap((s) => s.domains));
  const usedGates = new Set(lib.flatMap((s) => s.gates));
  const domains = framework.domains.filter((d) => used.has(d.id)).map((d) => ({ value: d.id, label: `${d.id} ${d.name}` }));
  const gates = framework.gates.filter((g) => usedGates.has(g.id)).map((g) => ({ value: g.id, label: `${g.id} ${g.name}` }));
  const states = STATE_ORDER.filter((s) => lib.some((x) => x.states.includes(s)));

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">AIDCF-004 Part XIV · {lib.length} cross-domain scenarios</p>
          <h1>How AI infrastructure fails across domains</h1>
          <p className="lede">
            Twenty reference failure scenarios, each crossing at least three domains: what starts it, how it
            propagates to the AI service, which safeguards should stop it, and the evidence that would show they
            work.
          </p>
          <div className="notice" role="note">
            <p>
              <strong>Reference patterns, not incidents or assessed cases.</strong> {scenarioLibrary.intro} The{" "}
              <Link href="/case/">synthetic case</Link> shows {caseData.scenarios.length} scenarios instantiated and
              assessed end to end.
            </p>
          </div>
        </div>
      </section>

      <section className="block" aria-label="Scenario library">
        <div className="wrap">
          <ScenarioFilter total={lib.length} domains={domains} gates={gates} states={states} />
          <div className="sc-list">
            {lib.map((s) => (
              <article
                key={s.id}
                id={s.id}
                className="card sc-card dx-anchor"
                data-domains={s.domains.join(" ")}
                data-gates={s.gates.join(" ")}
                data-states={s.states.join(" ")}
              >
                <h2 className="sc-title">
                  <span className="mono">{s.id}</span> {s.title}
                </h2>
                <p className="dx-tags small">
                  {s.domains.map((d) => (
                    <Link key={d} href={`/domains/${d.toLowerCase()}/`}>
                      {d}
                    </Link>
                  ))}
                  {s.gates.map((g) => (
                    <span key={g} className="crit" title={gateName(g)}>
                      {g}
                    </span>
                  ))}
                </p>
                <p>
                  <strong>Starts with.</strong> {s.initiatingEvent}
                </p>
                <p className="small">
                  <strong>Service outcomes affected.</strong> {s.serviceOutcomes}.
                </p>
                <details className="sc-more">
                  <summary>Propagation path ({s.path.length} steps)</summary>
                  <ol className="sc-path" aria-label={`Propagation path of ${s.id}`}>
                    {s.path.map((p, i) => (
                      <li key={i}>
                        <span className="sc-dom mono">{p.domains.join(" → ") || "·"}</span>
                        <span>{p.text}</span>
                      </li>
                    ))}
                  </ol>
                </details>
                <details className="sc-more">
                  <summary>Safeguards, evidence and unknowns</summary>
                  <h3>Preconditions</h3>
                  <p className="small">{s.preconditions}</p>
                  <h3>Operating states</h3>
                  <p className="small">{s.operatingStates}</p>
                  <h3>Safeguards that should interrupt it</h3>
                  <ul className="small">
                    {s.safeguards.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                  <h3>Evidence that would show the safeguards work</h3>
                  <ul className="small">
                    {s.evidence.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                  <h3>Typical UNKNOWNs</h3>
                  <p className="small">{s.unknowns}</p>
                  <h3>Where it is assessed</h3>
                  <p className="small">
                    Control families:{" "}
                    {s.families.map((f, i) => (
                      <span key={f}>
                        {i > 0 && ", "}
                        <Link href={`/domains/${f.slice(0, 3).toLowerCase()}/#${f}`} className="mono">
                          {f}
                        </Link>
                      </span>
                    ))}
                    . Critical gates: {s.gates.map((g) => `${g} ${gateName(g)}`).join("; ")}. Required functions:{" "}
                    {s.requiredFunctions}.
                  </p>
                </details>
              </article>
            ))}
          </div>
          <p className="caption">
            Source: <a href={sourceUrl(scenarioLibrary.source)}>AIDCF-004 Threat, Hazard and Failure Model v1.1</a>, Part
            XIV. Generated from the pinned commit; nothing on this page is written by hand.
          </p>
        </div>
      </section>
    </>
  );
}
