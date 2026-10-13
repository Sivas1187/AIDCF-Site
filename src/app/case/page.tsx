import Link from "next/link";
import type { Metadata } from "next";
import { CaseExplorer } from "@/components/CaseExplorer";
import { FailureStory } from "@/components/FailureStory";
import { GateResults } from "@/components/GateResults";
import { caseData, gateName, humanise, manifest, percent, repoUrl, sourceUrl } from "@/lib/data";

export const metadata: Metadata = {
  title: "Infrastructure graph (synthetic case)",
  description:
    "Trace failures through a synthetic AI training and inference capability: dependencies, shared fault domains, safeguards, controls, evidence, critical gates and the computed assurance decision.",
};

export default function CasePage() {
  const d = caseData.decision;
  const sc = caseData.score;
  const ceilings = d.otherCeilings?.replace(/^Ceilings that are not controlling:\s*/, "").replace(/\.$/, "").split("; ") ?? [];
  const datasetDir = "implementation/aidcf-015-v1.3";
  // A recorded erratum on the decision question: show the corrected wording, keep the released text one click away.
  const erratum = caseData.errata[0] ?? null;
  const question = erratum?.correction.match(/"([^"]+)"/)?.[1] ?? d.question;

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">Synthetic case · AIDCF-015 reference implementation v1.3</p>
          <h1>One AI capability, traced end to end</h1>
          <p className="lede">
            A synthetic AI training and inference capability, assessed with the AIDCF method. Follow a failure from
            its origin to the service outcome it breaks, see which safeguards and controls should stop it, and how
            the evidence drives the gates and the final decision.
          </p>
          <div className="notice" role="note">
            <p>
              <strong>Synthetic data.</strong> This case describes no real facility. Every value is illustrative, and
              the approval record is synthetic: no human approved this decision.
            </p>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="story-board-h">
        <div className="wrap">
          <FailureStory variant="board" />
          <p className="small muted">
            This is one of {caseData.scenarios.length} failure scenarios instantiated in this case. The full graph
            below is the expert view: every element, dependency and scenario. The{" "}
            <Link href="/scenarios/">scenario library</Link> has the twenty cross-domain reference scenarios of AIDCF-004.
          </p>
        </div>
      </section>

      <section className="block" aria-labelledby="question-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">1</span>
            <h2 id="question-h">The decision question</h2>
          </div>
          <div className="card">
            <p style={{ fontSize: "1.1rem" }}>{question}</p>
            <p className="small muted" style={{ margin: 0 }}>
              Scope: {d.scope}
            </p>
            {erratum && (
              <details className="erratum">
                <summary>Corrected by erratum {erratum.id}; the decision is unchanged.</summary>
                <p className="small">
                  <strong>As released:</strong> {d.question}
                </p>
                <p className="small">{erratum.erratum}</p>
                <p className="small">
                  The released file is fixed by its hash, so the correction is recorded in the{" "}
                  <a href={sourceUrl("ERRATA.md")}>errata register</a> and applied in the next release.
                </p>
              </details>
            )}
          </div>
          <h3 style={{ marginTop: 24 }}>Required service outcomes</h3>
          <div className="table-scroll">
            <table className="table stack">
              <thead>
                <tr>
                  <th scope="col">Outcome</th>
                  <th scope="col">Measure</th>
                  <th scope="col">Tolerance</th>
                  <th scope="col">Operating states</th>
                </tr>
              </thead>
              <tbody>
                {caseData.outcomes.map((o) => (
                  <tr key={o.id}>
                    <td data-label="Outcome">
                      <span className="mono">{o.id}</span> {o.name}
                    </td>
                    <td data-label="Measure">{o.measure.replace(/^Illustrative: /, "")}</td>
                    <td data-label="Tolerance">{o.tolerance.replace(/^Illustrative: /, "")}</td>
                    <td data-label="Operating states" className="mono small">
                      {o.states.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="graph-h">
        <div className="wrap wide">
          <div className="section-head">
            <span className="num">2</span>
            <h2 id="graph-h">Dependencies and failure paths</h2>
            <p>
              {caseData.nodes.length} elements and {caseData.dependencies.length} recorded dependencies.{" "}
              {caseData.faultDomains.length} shared fault domains make apparently redundant equipment fail together.
            </p>
          </div>
          <div id="journey" className="dx-anchor">
            <CaseExplorer />
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="gates-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">3</span>
            <h2 id="gates-h">Critical gate results</h2>
            <p>
              {caseData.summary.fail.length} gates fail, {caseData.summary.unknown.length} are UNKNOWN and{" "}
              {caseData.summary.notAssessed} were not assessed, so {caseData.summary.pass === 0 ? "none passes" : `${caseData.summary.pass} pass`}.
              Only {caseData.summary.assessed} of {sc.coverage.inScopeCount} controls were assessed. Select a gate to
              see why.
            </p>
          </div>
          <GateResults />
        </div>
      </section>

      <section className="block" aria-labelledby="decision-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">4</span>
            <h2 id="decision-h">The assurance decision</h2>
          </div>
          <div className="decision-card">
            <p className="eyebrow" style={{ margin: 0 }}>
              Decision state
            </p>
            <p className="big" style={{ margin: "4px 0 8px" }}>
              {d.state}
            </p>
            <p>
              <strong>Controlling reason:</strong>{" "}
              {d.controllingReasons
                .map((r) => {
                  const gate = r.match(/CG-\d+/)?.[0];
                  return gate ? `${r}, ${gateName(gate)}` : r;
                })
                .join("; ")}
              . The most restrictive ceiling wins; it is not an average.
            </p>
            <div className="stats">
              <div>
                <b>{sc.coverage.assessedCount}</b>
                <span>controls assessed of {sc.coverage.inScopeCount}</span>
              </div>
              <div>
                <b>{sc.coverage.scoredCount}</b>
                <span>scored ({sc.coverage.unknownCount} UNKNOWN)</span>
              </div>
              <div>
                <b>{percent(sc.coverage.coveragePercent, 2)}</b>
                <span>coverage (scored controls only)</span>
              </div>
              <div>
                <b>{sc.band}</b>
                <span>score band</span>
              </div>
            </div>
            <p className="small">
              <strong>Why the score band is withheld:</strong> {sc.bandWithheldReason}. AIDCF withholds the band below 80%
              coverage, or while a US4 or US5 UNKNOWN is open, so a score cannot imply more than the evidence supports.
            </p>
            {d.validUntil && (
              <p className="small muted" style={{ margin: 0 }}>
                Valid until {d.validUntil} unless a reassessment trigger fires first. {d.approvalNote}
              </p>
            )}
          </div>

          <div className="grid-2" style={{ marginTop: 20 }}>
            <div className="card">
              <h3>Other ceilings that did not control</h3>
              <p className="small muted">Each would cap the decision on its own; NOT_ASSURED is more restrictive than all of them.</p>
              <ul className="small">
                {ceilings.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3>Open UNKNOWN records</h3>
              <ul className="small">
                {caseData.unknowns.map((u) => (
                  <li key={u.id}>
                    <span className="state s-unknown">
                      {u.id} {u.severity}
                    </span>{" "}
                    <strong>{u.name}.</strong> {u.decisionEffect}{" "}
                    <span className="muted">Evidence needed: {u.evidenceNeeded}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="verify-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">5</span>
            <h2 id="verify-h">Check it yourself</h2>
            <p>Everything on this page is generated from the reference implementation at commit {manifest.commit.slice(0, 7)}.</p>
          </div>
          <div className="grid-2">
            <div className="card">
              <h3>Data</h3>
              <ul>
                <li>
                  <a href={sourceUrl(`${datasetDir}/dataset`, "tree")}>Synthetic dataset (JSON-LD)</a>
                </li>
                <li>
                  <a href={sourceUrl(`${datasetDir}/outputs`, "tree")}>Computed outputs and validation results</a>
                </li>
                <li>
                  <a href={sourceUrl(`${datasetDir}/README.md`)}>Reference implementation guide</a>
                </li>
              </ul>
            </div>
            <div className="card">
              <h3>Re-run the checks</h3>
              <pre className="cite">{`git clone ${repoUrl}
cd AIDCF && git checkout ${manifest.commit.slice(0, 7)}
cd ${datasetDir}
pip install -r requirements.txt
python3 -B tools/run_all.py`}</pre>
              <p className="small muted" style={{ marginTop: 8, marginBottom: 0 }}>
                Score calculation hash: <span className="hash">{sc.hash}</span>
              </p>
            </div>
          </div>
          <p className="caption">
            Terms such as {humanise("NOT_ASSESSED").toLowerCase()} and the US1 to US5 UNKNOWN severities are defined in
            AIDCF-010 and the vocabularies in the repository.
          </p>
        </div>
      </section>
    </>
  );
}
