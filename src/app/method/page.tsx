import type { Metadata } from "next";
import Link from "next/link";
import { framework, sourceUrl, validation } from "@/lib/data";

export const metadata: Metadata = {
  title: "Method in detail",
  description:
    "How AIDCF relates to existing engineering and security reviews, what an assessment is designed to produce, the fifteen critical gates with their evidence floors and ceilings, and the validation instruments.",
};

// Review types, what each can establish, and what it may leave open for an AI
// workload depending on how it is scoped. This is the project's own analysis
// (see the impact assessment in the repository), not a measured survey, and
// whether AIDCF adds anything to these reviews is what VAL-001 v1.1 section 10A
// is designed to test.
const reviewGap = [
  {
    review: "Tier certification, ANSI/TIA-942 rating, EN 50600 / ISO/IEC 22237 classification",
    establishes: "Facility design topology and availability class",
    gap: "Whether a training or inference service survives the failures that matter to it, such as loss of a cooling loop at full accelerator load, a fabric partition or a checkpoint-store outage",
  },
  {
    review: "Commissioning and integrated systems testing",
    establishes: "That systems, often several of them together, worked as designed at handover",
    gap: "Behaviour after later changes, under real AI load profiles and through recovery, unless these were in the test scope",
  },
  {
    review: "Engineering and reliability studies (power system studies, FMEA, fault tree analysis)",
    establishes: "Failure modes and fault behaviour of the systems studied, which can cross power, cooling and controls",
    gap: "Whether the study follows each failure through to the AI service outcomes, and whether it still holds after changes",
  },
  {
    review: "OT security risk assessment (IEC 62443-3-2)",
    establishes: "Zones, conduits, threats and target security levels for the control systems in scope",
    gap: "How a compromise would affect power, cooling and the AI workload, where that consequence is outside the assessment scope",
  },
  {
    review: "ISO/IEC 27001, SOC 2 and similar reports",
    establishes: "That a security management system and selected controls are in place for the declared scope, which can include building and OT control systems",
    gap: "Whether that scope actually reaches the power and cooling control systems, and how a failure there would affect AI outcomes",
  },
  {
    review: "ISO/IEC 42001, NIST AI RMF",
    establishes: "Governance of AI systems and their risks",
    gap: "The physical and technical infrastructure those AI systems depend on",
  },
  {
    review: "Technical due diligence",
    establishes: "A point-in-time expert opinion",
    gap: "A reproducible, evidence-linked argument that a second assessor could re-perform",
  },
];

// Where AIDCF sits next to specialist reviews. The difference is the level at which
// the assurance argument is organised, not a claim that other methods lack
// cross-domain reasoning; any comparative benefit is untested (VAL-001 v1.1 10A).
const roleCompare = [
  {
    dim: "Primary subject",
    review: "A defined facility, system, process or engineering scope",
    aidcf: "A defined AI capability and its required service outcomes",
  },
  {
    dim: "Technical depth",
    review: "Deep expertise within the engagement's scope",
    aidcf: "Uses specialist assessments as evidence and does not replace them",
  },
  {
    dim: "Failure analysis",
    review: "FMEA, fault tree analysis and integrated systems testing can already analyse cross-system failures",
    aidcf: "Relates those failure paths to a capability-level assurance question",
  },
  {
    dim: "Evidence",
    review: "What the relevant standard or engagement requires",
    aidcf: "Links each piece of evidence to the controls, gates and conclusion it supports",
  },
  {
    dim: "Uncertainty",
    review: "Can be managed explicitly, depending on the method",
    aidcf: "UNKNOWN is a formal, visible state that caps the decision",
  },
  {
    dim: "Output",
    review: "Certificate, test report, risk findings or engineering recommendation",
    aidcf: "A bounded, capability-specific assurance decision with an accountable owner",
  },
  {
    dim: "Validation maturity",
    review: "Varies by standard and practice",
    aidcf: "Research stage: a validation candidate, not yet used on a real facility",
  },
];

// A practical problem, and the AIDCF work product designed to address it (AIDCF-009 Part A
// workpapers). These are intended outputs, not demonstrated benefits.
const outputs = [
  {
    problem: "Nobody has defined what must be assured for this AI capability",
    output: "A bounded decision question and service-outcome requirements",
    wp: "WP-01 Assessment Charter, WP-02 Capability Profile",
  },
  {
    problem: "Infrastructure dependencies are spread across teams",
    output: "A traceable capability and dependency model",
    wp: "WP-03 Scope and Boundary",
  },
  {
    problem: "Engineering and security findings use different scopes and evidence",
    output: "Mapped controls, safeguards and evidence requirements",
    wp: "WP-04 Applicability Matrix, WP-06 Evidence Request, WP-12 Control Result",
  },
  {
    problem: "Important controls or dependencies cannot be verified",
    output: "Explicit findings, UNKNOWN records and gate limitations",
    wp: "WP-13 to WP-17",
  },
  {
    problem: "Decision-makers receive reports without a consolidated assurance basis",
    output: "An independently reviewed, bounded decision record",
    wp: "WP-18 Independent Review, WP-19 Assurance Decision",
  },
];

// AIDCF-009 Part A section 0.6 (lifecycle) and A6 (stage gates SG0 to SG7).
const handbook = "standards/aidcf-009-assessment-methodology/AIDCF-009_Part_A_Core_Practitioner_Handbook_v1.1.md";

export default function MethodPage() {
  const bt = validation.backTest;
  const ep = validation.expertPanel;
  const pil = validation.pilot;
  const ir = validation.independentReview;
  const pilotPending = bt.comparison.pilot.filter((b) => !b.approved);
  const spell = (n: number) => ["no", "one", "two", "three", "four", "five", "six"][n] ?? String(n);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">Method in detail</p>
          <h1>The detail behind the homepage</h1>
          <p className="lede">
            How AIDCF relates to the reviews already used today, what an assessment is designed to produce, the fifteen
            critical gates and the instruments that will test the method.
          </p>
          <nav aria-label="On this page" className="actions">
            <a className="btn" href="#reviews">Existing reviews</a>
            <a className="btn" href="#compare">Alongside specialist reviews</a>
            <a className="btn" href="#outputs">Outputs</a>
            <a className="btn" href="#gates">Critical gates</a>
            <a className="btn" href="#instruments">Validation instruments</a>
          </nav>
        </div>
      </section>

      <section className="block" id="reviews" aria-labelledby="reviews-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">1</span>
            <h2 id="reviews-h">Existing reviews and what they may leave open</h2>
            <p>
              Existing reviews cover the infrastructure behind an AI service to different extents. Some, such as
              integrated systems testing, reliability studies and OT risk assessments, cross several domains.
            </p>
          </div>
          <div className="table-scroll">
            <table className="table stack">
              <caption className="visually-hidden">Common review types and the gap each leaves for an AI workload</caption>
              <thead>
                <tr>
                  <th scope="col">Review commonly used today</th>
                  <th scope="col">What it establishes</th>
                  <th scope="col">What it may leave open for an AI workload, depending on scope</th>
                </tr>
              </thead>
              <tbody>
                {reviewGap.map((r) => (
                  <tr key={r.review}>
                    <td data-label="Review">{r.review}</td>
                    <td data-label="Establishes">{r.establishes}</td>
                    <td data-label="May leave open">{r.gap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="caption">
            The project&rsquo;s own analysis, not a survey or a measured result. A particular review may cover more
            than shown here. AIDCF treats existing certifications and reports as bounded evidence, not as proof that
            an AI capability is resilient.
          </p>
        </div>
      </section>

      <section className="block" id="compare" aria-labelledby="compare-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">2</span>
            <h2 id="compare-h">AIDCF alongside specialist reviews</h2>
            <p>
              The difference is the level at which the assurance argument is organised, not a claim that other methods
              lack cross-domain reasoning.
            </p>
          </div>
          <div className="card" style={{ marginBottom: 20 }}>
            <p className="eyebrow" style={{ margin: 0 }}>
              Illustrative example, not an empirical finding about existing reviews
            </p>
            <h3>A facility looks well assessed. Is the AI service assured?</h3>
            <p>
              <strong>Evidence available:</strong> power redundancy reviewed, cooling commissioned, protection
              coordination studied, OT security assessed.
            </p>
            <p>
              <strong>Question still open:</strong> will the AI workload meet its recovery and service tolerances
              during a shared cooling-control failure?
            </p>
            <ol className="steps-inline">
              <li>
                <b>Define</b> the capability, service outcome and tolerance.
              </li>
              <li>
                <b>Trace</b> the infrastructure, dependencies and failure paths that matter to it.
              </li>
              <li>
                <b>Evaluate</b> the safeguards, controls and supporting evidence.
              </li>
              <li>
                <b>Decide</b> whether the evidence supports a bounded assurance conclusion.
              </li>
            </ol>
          </div>
          <div className="table-scroll">
            <table className="table stack">
              <caption className="visually-hidden">Specialist review and AIDCF compared by dimension</caption>
              <thead>
                <tr>
                  <th scope="col">Dimension</th>
                  <th scope="col">Specialist review</th>
                  <th scope="col">AIDCF&rsquo;s proposed role</th>
                </tr>
              </thead>
              <tbody>
                {roleCompare.map((r) => (
                  <tr key={r.dim}>
                    <td data-label="Dimension">{r.dim}</td>
                    <td data-label="Specialist review">{r.review}</td>
                    <td data-label="AIDCF">{r.aidcf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 style={{ marginTop: 28 }}>Three hypotheses, not yet tested</h3>
          <ul>
            <li>AIDCF may improve traceability across assurance evidence.</li>
            <li>It may expose gaps between component-level findings and service-level decisions.</li>
            <li>It may make uncertainty and decision responsibility more explicit.</li>
          </ul>
          <div className="notice" role="note" style={{ marginTop: 16 }}>
            <p>
              <strong>Untested claim.</strong> Whether AIDCF finds weaknesses that these reviews miss has not been
              tested. The draft{" "}
              <a href={sourceUrl(bt.draftProtocol)}>comparative protocol (AIDCF-VAL-001 v1.1, section 10A)</a> is
              designed to test it against engineering studies, commissioning and OT risk assessment.{" "}
              {bt.comparison.rows > 0 ? "Comparative coding has started; no results are published yet." : "No comparative coding has started, so there are no results."}
            </p>
          </div>
        </div>
      </section>

      <section className="block" id="outputs" aria-labelledby="outputs-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">3</span>
            <h2 id="outputs-h">What an assessment is designed to produce</h2>
            <p>
              The work products of AIDCF-009 Part A, against the practical problem each is meant to address. See the{" "}
              <Link href="/#how">assessment lifecycle</Link> for the stage gates.
            </p>
          </div>
          <div className="table-scroll">
            <table className="table stack">
              <caption className="visually-hidden">Practical problems and the AIDCF output designed for each</caption>
              <thead>
                <tr>
                  <th scope="col">Practical problem</th>
                  <th scope="col">Intended output</th>
                  <th scope="col">Workpapers</th>
                </tr>
              </thead>
              <tbody>
                {outputs.map((o) => (
                  <tr key={o.problem}>
                    <td data-label="Problem">{o.problem}</td>
                    <td data-label="Output">{o.output}</td>
                    <td data-label="Workpapers" className="small">
                      {o.wp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="caption">
            Roles include a sponsor, lead assessor, domain specialists, an evidence lead, technical and independent
            reviewers, a safety authority, the capability owner and the decision authority, with separation rules
            between them. Source: <a href={sourceUrl(handbook)}>AIDCF-009 Part A practitioner handbook</a> (draft for
            controlled review). These outputs are what the method is designed to produce, not demonstrated benefits
            such as fewer outages or lower assessment cost.
          </p>
        </div>
      </section>

      <section className="block" id="gates" aria-labelledby="gates-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">4</span>
            <h2 id="gates-h">The fifteen critical gates</h2>
            <p>
              Each gate has its own criteria, an evidence floor, and a ceiling that applies when it fails or is
              UNKNOWN. In total {framework.counts.critical} control-to-gate mappings are CRITICAL and{" "}
              {framework.counts.supporting} are SUPPORTING, against {framework.counts.gateCriteria} gate criteria. See{" "}
              <Link href="/#domains">which domains feed each gate</Link>, or open the{" "}
              <Link href="/domains/">domain explorer</Link>.
            </p>
          </div>
          <div className="gate-list">
            {framework.gates.map((g) => (
              <details className="gate" key={g.id} id={g.id.toLowerCase()}>
                <summary>
                  <span className="mono">{g.id}</span>
                  <span>{g.name}</span>
                  <span className="muted small">
                    {g.critical} critical · {g.supporting} supporting controls · {g.criteria} criteria
                  </span>
                </summary>
                <div className="body">
                  <dl>
                    <dt>Scope</dt>
                    <dd>{g.scope}</dd>
                    <dt>Evidence floor</dt>
                    <dd className="mono">{g.evidenceFloor}</dd>
                    <dt>If the gate fails</dt>
                    <dd>{g.failCeiling}</dd>
                    <dt>If the gate is UNKNOWN</dt>
                    <dd>{g.unknownCeiling}</dd>
                  </dl>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="block" id="instruments" aria-labelledby="instruments-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">5</span>
            <h2 id="instruments-h">Validation instruments</h2>
            <p>
              The instruments designed to test AIDCF, and where each stands. The overall{" "}
              <Link href="/#validation">validation status</Link> is on the homepage.
            </p>
          </div>
          <div className="table-scroll">
            <table className="table stack">
              <caption className="visually-hidden">Validation instruments and their state</caption>
              <thead>
                <tr>
                  <th scope="col">Instrument</th>
                  <th scope="col">Question it tests</th>
                  <th scope="col">State</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td data-label="Instrument">
                    <a href={sourceUrl(bt.protocol)}>Incident back-test (AIDCF-VAL-001)</a>
                  </td>
                  <td data-label="Question">
                    Would AIDCF have flagged the causes of real, publicly reported outages, and would conventional
                    reviews have flagged them too?
                  </td>
                  <td data-label="State">
                    Protocol v1.0 in force. Draft{" "}
                    <a href={sourceUrl(bt.draftProtocol)}>v1.1</a> adds the comparison with conventional reviews, and its
                    instruments are implemented.{" "}
                    {pilotPending.length > 0
                      ? `${pilotPending.length === bt.comparison.pilot.length ? `The ${spell(pilotPending.length)}` : `${pilotPending.length} of the ${bt.comparison.pilot.length}`} pilot comparison profiles await practitioner approval; the other ${spell(bt.comparison.baselines - bt.comparison.pilot.length)} methods are not in the initial pilot.`
                      : `All ${bt.comparison.pilot.length} pilot comparison profiles are approved.`}{" "}
                    Sampling frame: {bt.logged} incidents logged, {bt.eligible}{" "}
                    eligible, {bt.excluded} excluded with reasons.{" "}
                    {bt.selected > 0 ? `${bt.selected} selected.` : "Sample not drawn."} No results.
                  </td>
                </tr>
                <tr>
                  <td data-label="Instrument">
                    <a href={sourceUrl(ep.protocol)}>Expert panel (AIDCF-VAL-002)</a>
                  </td>
                  <td data-label="Question">Do independent specialists agree the controls and gates are relevant and clear?</td>
                  <td data-label="State">
                    Kit ready: {ep.controls} sampled controls and {ep.gates} gates. Panel not yet recruited.
                  </td>
                </tr>
                <tr>
                  <td data-label="Instrument">
                    <a href={sourceUrl(pil.protocol)}>Mini-pilot (AIDCF-PIL-001)</a>
                  </td>
                  <td data-label="Question">Can AIDCF be applied to a real facility, and at what cost?</td>
                  <td data-label="State">
                    Pack ready: a {pil.starterControls}-control starter profile and a {pil.evidenceRequests}-item
                    evidence request list. No host facility yet.
                  </td>
                </tr>
                <tr>
                  <td data-label="Instrument">
                    <a href={sourceUrl("validation/independent-review/README.md")}>Independent review</a>
                  </td>
                  <td data-label="Question">Does the method stand up to power, cooling, HPC, OT security and assurance specialists?</td>
                  <td data-label="State">
                    {ir.reviews > 0 ? `${ir.reviews} received; ${ir.dispositions} dispositions published.` : "Not started. Reviewers are invited."}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
