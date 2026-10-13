import Link from "next/link";
import { ChainVisual } from "@/components/ChainVisual";
import { FailureStory } from "@/components/FailureStory";
import {
  caseData,
  formatNumber,
  framework,
  gateName,
  manifest,
  percent,
  repoUrl,
  research,
  sourceUrl,
  validation,
} from "@/lib/data";

const pct = (n: number) => percent(n, 2);

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

// Intended users. Who applies AIDCF and who uses its outputs are different groups.
const audiences = [
  {
    title: "Data-centre owners and operators",
    who: "Facilities directors, critical environment teams, reliability engineers, infrastructure operations leaders",
    use: "Relate facility engineering evidence to the dependencies and service outcomes of a defined AI capability, and see where more testing or evidence may be needed.",
  },
  {
    title: "AI infrastructure and service owners",
    who: "GPU cluster and HPC platform owners, AI service engineering and workload reliability teams",
    use: "See which facilities, systems, operating states and shared dependencies could stop the AI service meeting its objectives.",
  },
  {
    title: "Assurance and engineering assessors",
    who: "Commissioning specialists, OT assessors, engineering consultants, internal audit and technology risk teams",
    use: "Use one structure to bring findings together, challenge unsupported conclusions and record what remains unknown, without displacing specialist assessments.",
  },
  {
    title: "Decision owners",
    who: "CTOs, infrastructure executives, service owners, investment and operational-risk committees",
    use: "Receive a traceable statement of what is assured, under which assumptions, for how long, and what limits the decision.",
  },
];

// AIDCF-009 Part A section 0.6 (lifecycle) and A6 (stage gates SG0 to SG7).
const handbook = "standards/aidcf-009-assessment-methodology/AIDCF-009_Part_A_Core_Practitioner_Handbook_v1.1.md";
const phases = [
  { name: "Initiate", gate: "SG0 Authorise", what: "Charter the decision question, sponsor, decision authority and intended users." },
  { name: "Profile, scope and tailor", gate: "SG1 Scope", what: "Define the capability, its boundary and dependencies, and which controls apply." },
  { name: "Plan", gate: "SG2 Plan", what: "Plan the work, rules of engagement, safety approvals, evidence requests and team competence." },
  { name: "Collect and validate", gate: "SG3 Fieldwork", what: "Document and configuration review, interviews, inspection, sampling, data analysis and testing." },
  { name: "Assess, analyse, gate and find", gate: "SG4 Technical review", what: "Control results, failure scenarios, critical gate results, findings and UNKNOWNs." },
  { name: "Review", gate: "SG5 Independent review", what: "An independent reviewer challenges the evidence, gate logic and recommendation." },
  { name: "Decide and report", gate: "SG6 Decide, SG7 Archive", what: "The decision authority issues a bounded decision, or records a decision not to issue one." },
  { name: "Reassess", gate: "Re-entry at SG0 or SG1", what: "Changes, incidents, evidence expiry and gate result changes trigger a delta or full reassessment." },
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

const doctrines = [
  {
    title: "Claims are scoped to a capability",
    body: "The subject is a bounded AI capability and its service outcomes, for example a training cluster that must complete jobs within a stated tolerance. A site-wide badge says nothing about that.",
  },
  {
    title: "Critical gates do not average",
    body: `${framework.counts.gates} critical gates are evaluated separately. A failed gate caps the decision however good the average score is, and a PARTIAL control result never lets a gate pass.`,
  },
  {
    title: "UNKNOWN stays visible",
    body: "Missing or inadequate evidence is recorded as an explicit UNKNOWN with a severity. It caps the decision until it is resolved, instead of being quietly assumed fine.",
  },
  {
    title: "Decisions are bounded and owned",
    body: "The outcome is one of five decision states with stated conditions, limitations and a validity period, approved by an accountable person. It is not a certificate.",
  },
];

export default function Home() {
  const s = caseData.summary;
  const bt = validation.backTest;
  const ev = validation.evidence;
  const pilotPending = bt.comparison.pilot.filter((b) => !b.approved);
  const shortName: Record<string, string> = {
    "BL-ENG": "engineering studies",
    "BL-CX": "commissioning",
    "BL-OT": "OT security risk assessment",
  };
  const spell = (n: number) => ["no", "one", "two", "three", "four", "five", "six"][n] ?? String(n);
  const listNames = (bs: { id: string; name: string }[]) =>
    bs
      .map((b) => shortName[b.id] ?? b.name.toLowerCase())
      .join(", ")
      .replace(/, ([^,]*)$/, " and $1");
  const ep = validation.expertPanel;
  const pil = validation.pilot;
  const ir = validation.independentReview;
  const conf = research.conformance;
  const registryProposed = /PROPOSED/.test(research.baseline ?? "");
  const domainGuide = (code: string) =>
    research.artifacts.find((a) => a.id === `AIDCF-018-${code}`)?.path ?? null;
  const author = research.citation.authors[0];
  const year = research.citation.released?.slice(0, 4) ?? "";

  const statusItems: { state: "done" | "progress" | "open"; text: React.ReactNode }[] = [
    {
      state: "done",
      text: (
        <>
          Canonical control baseline published: {framework.counts.domains} domains, {framework.counts.families}{" "}
          families, {framework.counts.controls} controls (registry v1.0, approved baseline).
        </>
      ),
    },
    {
      state: registryProposed ? "progress" : "done",
      text: registryProposed ? (
        <>Registry v1.1, which makes every control testable, is proposed under amendment AMD-002 and not yet approved.</>
      ) : (
        <>Registry v1.1 approved.</>
      ),
    },
    {
      state: conf.allPass ? "done" : "progress",
      text: (
        <>
          Synthetic reference implementation passes {conf.layers.length} validation layers ({formatNumber(conf.checks)}{" "}
          checks). {conf.independent ? "Independently executed." : "This is self-validation by the author's tooling, not independent execution."}
        </>
      ),
    },
    {
      state: "progress",
      text: (
        <>
          Incident back-test (AIDCF-VAL-001): protocol prepared and comparison instruments implemented (v1.1, draft).{" "}
          {pilotPending.length > 0
            ? `The ${pilotPending.length === bt.comparison.pilot.length ? spell(pilotPending.length) : pilotPending.length} pilot comparison profiles (${listNames(pilotPending)}) are awaiting practitioner approval. `
            : ""}
          {bt.selected > 0 ? `${bt.selected} incidents selected for coding. ` : "The sample has not been drawn. "}
          No results are available.
        </>
      ),
    },
    {
      state: ir.reviews > 0 ? "progress" : "open",
      text: <>Independent multidisciplinary review. {ir.reviews > 0 ? `${ir.reviews} review(s) received.` : "Not started."}</>,
    },
    { state: "open", text: <>Authorised pilot on a real facility. Not started; the pilot pack is ready.</> },
    { state: "open", text: <>Inter-rater reproducibility trial. Not started.</> },
    {
      state: research.citation.doi ? "done" : "open",
      text: research.citation.doi ? <>DOI {research.citation.doi}</> : <>DOI for the whitepaper. Not yet minted.</>,
    },
  ];

  const mark = { done: "✓", progress: "◐", open: "○" } as const;
  const markLabel = { done: "Done", progress: "In progress", open: "Not started" } as const;

  const apa = `${author?.family}, ${author?.given?.charAt(0)}. (${year}). ${research.citation.reportTitle ?? research.citation.title} (Release ${manifest.release}). ${research.citation.doi ? `https://doi.org/${research.citation.doi}` : repoUrl}`;
  const bibtex = `@techreport{${(author?.family ?? "aidcf").toLowerCase()}${year}aidcf,
  author      = {${author?.family}, ${author?.given}},
  title       = {${research.citation.reportTitle ?? research.citation.title}},
  year        = {${year}},
  number      = {${manifest.release}},
  url         = {${repoUrl}},${research.citation.doi ? `\n  doi         = {${research.citation.doi}},` : ""}
  note        = {Version ${research.citation.version}}
}`;

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">
            Public review edition · {research.repositoryStatus} · Release {manifest.release}
            {research.citation.released ? `, ${research.citation.released}` : ""}
          </p>
          <h1>Can your AI infrastructure support the outcomes your AI services depend on?</h1>
          <p className="lede">
            The {research.name} (AIDCF) is an open, evidence-driven assessment methodology. It connects facilities,
            power, cooling, compute, storage, networks, operations and suppliers to the requirements of a defined AI
            service, and brings existing engineering and security evidence into one traceable argument, so that
            dependencies, safeguards, gaps and uncertainty are visible before an accountable person decides.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/#how">
              See how it works
            </Link>
            <Link className="btn" href="/case/">
              See the synthetic example
            </Link>
            <a className="btn" href={repoUrl}>
              View on GitHub
            </a>
          </div>
          <p className="status-line" role="note">
            Research-stage methodology · Not a certification ·{" "}
            {ev.completedAssessments === 0
              ? "No completed real-world assessment recorded"
              : `${ev.completedAssessments} completed real-world assessment(s) recorded`}{" "}
            · Independent validation {ir.reviews > 0 ? "under review" : "pending"}
          </p>
          <FailureStory variant="hero" />
        </div>
      </section>

      <section className="block" id="problem" aria-labelledby="problem-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">01</span>
            <h2 id="problem-h">The problem</h2>
            <p>
              A reliable AI service needs dense, transient power, liquid cooling, tightly coupled fabrics, checkpoint
              storage, building control systems and outside suppliers to work together. Existing reviews cover
              these to different extents. Some, such as integrated systems testing, reliability studies and OT risk
              assessments, cross several domains. Whether a given set of reviews, as scoped for a particular site,
              shows that the AI workload itself can deliver its outcomes is an open question that depends on that
              scope.
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
          <div className="card" style={{ marginTop: 20 }}>
            <h3>The question AIDCF answers</h3>
            <p>
              Can this specific AI capability, under these operating conditions, deliver its required outcomes, and
              what is the evidence?
            </p>
          </div>
        </div>
      </section>

      <section className="block" id="what" aria-labelledby="what-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">02</span>
            <h2 id="what-h">What AIDCF is</h2>
            <p>
              AIDCF evaluates whether the infrastructure behind a defined AI capability can meet that
              capability&rsquo;s required outcomes under stated conditions. It builds a traceable argument from
              dependencies and failure scenarios, through safeguards, controls and evidence, to an accountable
              assurance decision. It complements existing technical standards and professional judgement; it does not
              replace them.
            </p>
          </div>
          <div className="card">
            <h3>What AIDCF is not</h3>
            <p style={{ margin: 0 }}>
              Not a monitoring platform, an uptime guarantee, a data-centre certification, an AI model-safety
              framework, or a replacement for engineering assurance.
            </p>
          </div>
          <h3 id="method" style={{ marginTop: 28 }}>
            How AIDCF reasons
          </h3>
          <p>
            One chain runs from the decision being made to the decision taken. Every link must be supported, and every
            gap is recorded rather than assumed away.
          </p>
          <ChainVisual />
        </div>
      </section>

      <section className="block" id="why" aria-labelledby="why-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">03</span>
            <h2 id="why-h">Why AIDCF, alongside existing reviews</h2>
            <p>
              The proposed contribution is not that existing engineering assurance is deficient. It is that a set of
              individually credible assessments does not by itself give one traceable conclusion for a particular AI
              service. AIDCF organises the assurance argument at that level.
            </p>
          </div>
          <div className="card">
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
          <div className="table-scroll" style={{ marginTop: 20 }}>
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
          <h3 style={{ marginTop: 28 }}>What it does differently</h3>
          <div className="grid-2">
            {doctrines.map((d) => (
              <div className="card" key={d.title}>
                <h3>{d.title}</h3>
                <p>{d.body}</p>
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: 28 }}>The five decision states, from strongest to most restrictive</h3>
          <ol className="decision-scale">
            {framework.decisionStates.map((d) => (
              <li key={d.code}>
                <span>
                  <span className={`state s-${d.code.toLowerCase()}`}>{d.code}</span>
                </span>
                <span>{d.meaning}.</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="block" id="who" aria-labelledby="who-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">04</span>
            <h2 id="who-h">Who it is for</h2>
            <p>
              Engineering and assurance practitioners apply AIDCF. Service owners and accountable executives use its
              outputs. It suits organisations that control, operate or can obtain meaningful evidence about the
              infrastructure behind an AI capability; it is not aimed at every tenant, IT team or AI model developer.
            </p>
          </div>
          <div className="grid-2">
            {audiences.map((a) => (
              <div className="card" key={a.title}>
                <h3>{a.title}</h3>
                <p className="small muted">{a.who}</p>
                <p style={{ margin: 0 }}>{a.use}</p>
              </div>
            ))}
          </div>
          <p className="caption">
            Intended uses. Whether AIDCF delivers them in practice is what the validation programme is designed to
            test.
          </p>
        </div>
      </section>

      <section className="block" id="how" aria-labelledby="how-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">05</span>
            <h2 id="how-h">How an assessment works</h2>
            <p>
              An assessment runs through eight phases, each closed by a stage gate with a named approver. It can be run
              first-party, co-sourced, second-party or by an independent third party. Its length depends on scope and
              evidence access; no typical duration is claimed.
            </p>
          </div>
          <ol className="phase-list">
            {phases.map((ph) => (
              <li key={ph.name}>
                <b>{ph.name}</b> <span className="mono small">{ph.gate}</span>
                <span>{ph.what}</span>
              </li>
            ))}
          </ol>
          <h3 style={{ marginTop: 28 }}>What it is designed to produce</h3>
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

      <section className="block" id="case" aria-labelledby="case-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">06</span>
            <h2 id="case-h">Worked example: a synthetic case</h2>
            <p>
              The reference implementation assesses one synthetic AI training and inference capability. It does not
              produce a favourable answer from thin evidence.
            </p>
          </div>
          <div className="decision-card">
            <p className="eyebrow" style={{ margin: 0 }}>
              Computed decision
            </p>
            <p className="big" style={{ margin: "4px 0 8px" }}>
              {caseData.decision.state}
            </p>
            <p style={{ margin: 0 }}>
              Controlled by{" "}
              {caseData.decision.controllingReasons
                .map((r) => {
                  const gate = r.match(/CG-\d+/)?.[0];
                  return gate ? `${r}, ${gateName(gate)}` : r;
                })
                .join("; ")}
              .
            </p>
            <div className="stats">
              <div>
                <b>{s.fail.length}</b>
                <span>gates fail ({s.fail.join(", ")})</span>
              </div>
              <div>
                <b>{s.unknown.length}</b>
                <span>gates UNKNOWN</span>
              </div>
              <div>
                <b>{pct(s.coveragePercent)}</b>
                <span>
                  coverage ({s.scored} of {caseData.score.coverage.inScopeCount} controls scored)
                </span>
              </div>
              <div>
                <b>{caseData.score.band}</b>
                <span>score band</span>
              </div>
            </div>
            <Link className="btn primary" href="/case/">
              Trace the failures and the evidence
            </Link>
          </div>
        </div>
      </section>

      <section className="block" id="domains" aria-labelledby="domains-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">07</span>
            <h2 id="domains-h">Fifteen assurance domains</h2>
            <p>
              Domains organise the assessment work and give every concern an owner. They do not partition the
              argument: a single failure scenario routinely crosses power, cooling, compute, storage, network,
              operations and security.
            </p>
          </div>
          <div className="figures" aria-label="Framework at a glance">
            <div className="figure">
              <b>{framework.counts.domains}</b>
              <span>assurance domains</span>
            </div>
            <div className="figure">
              <b>{framework.counts.families}</b>
              <span>control families</span>
            </div>
            <div className="figure">
              <b>{framework.counts.controls}</b>
              <span>controls</span>
            </div>
            <div className="figure">
              <b>{framework.counts.gates}</b>
              <span>non-compensating critical gates</span>
            </div>
          </div>
          <ul className="domain-grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {framework.domains.map((d) => {
              const guide = domainGuide(d.id);
              return (
                <li className="domain" key={d.id}>
                  <Link className="code" href={`/domains/${d.id.toLowerCase()}/`}>
                    {d.id}
                    <span className="visually-hidden"> controls</span>
                  </Link>
                  <span>{d.name}</span>
                  <span className="meta">
                    {d.families} families · {d.controls} controls · gates {d.gates.join(", ") || "none"}
                  </span>
                  {guide && (
                    <a className="small" href={sourceUrl(guide)}>
                      Domain guide<span className="visually-hidden"> for {d.name}</span>
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="actions" style={{ marginTop: 16 }}>
            <Link className="btn primary" href="/domains/">
              Open the domain explorer
            </Link>
          </p>
        </div>
      </section>

      <section className="block" id="gates" aria-labelledby="gates-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">08</span>
            <h2 id="gates-h">Fifteen critical gates</h2>
            <p>
              Each gate has its own criteria, an evidence floor, and a ceiling that applies when it fails or is
              UNKNOWN. In total {framework.counts.critical} control-to-gate mappings are CRITICAL and{" "}
              {framework.counts.supporting} are SUPPORTING, against {framework.counts.gateCriteria} gate criteria.
            </p>
          </div>
          <div className="gate-list">
            {framework.gates.map((g) => (
              <details className="gate" key={g.id}>
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

      <section className="block" id="validation" aria-labelledby="validation-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">09</span>
            <h2 id="validation-h">Validation status</h2>
            <p>What has been done, what has been prepared, and what is still needed before anyone should rely on AIDCF.</p>
          </div>
          <p className="evidence-ladder">
            <b>{ev.libraryScenarios}</b> reference failure patterns in the methodology,{" "}
            <b>{ev.caseScenarios}</b> instantiated in the synthetic case,{" "}
            {ev.completedAssessments === 0 ? (
              <>and no completed real-world assessment recorded.</>
            ) : (
              <>
                <b>{ev.completedAssessments}</b> completed real-world{" "}
                {ev.completedAssessments === 1 ? "assessment" : "assessments"} recorded, and{" "}
                <b>{ev.independentlyReviewed}</b> of them independently reviewed.
              </>
            )}
          </p>
          <ul className="checklist" aria-label="Release status">
            {statusItems.map((item, i) => (
              <li key={i} className={item.state}>
                <span className="mark" aria-hidden="true">
                  {mark[item.state]}
                </span>
                <span>
                  <span className="visually-hidden">{markLabel[item.state]}: </span>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
          <h3 style={{ marginTop: 28 }}>Validation instruments</h3>
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

      <section className="block" id="research" aria-labelledby="research-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">10</span>
            <h2 id="research-h">Research and artifacts</h2>
            <p>The GitHub repository is the canonical source. This site is generated from it at a pinned commit.</p>
          </div>
          <div className="grid-2">
            <div className="card">
              <h3>Technical whitepaper v{research.citation.version}</h3>
              <p>{research.citation.reportTitle}.</p>
              <p className="actions" style={{ margin: "12px 0" }}>
                <a className="btn primary" href={sourceUrl(research.whitepaper.pdf)}>
                  PDF
                </a>
                <a className="btn" href={sourceUrl(research.whitepaper.md)}>
                  Markdown
                </a>
              </p>
              <p className="small muted">
                SHA-256 of the PDF at commit <span className="mono">{manifest.commit.slice(0, 7)}</span>:
              </p>
              <p className="hash">{research.whitepaper.pdfSha256}</p>
            </div>
            <div className="card">
              <h3>How to cite</h3>
              <p className="small muted">
                {research.citation.doi ? `DOI ${research.citation.doi}.` : "A DOI has not been minted yet; cite the repository and release."}
              </p>
              <pre className="cite" aria-label="APA citation">
                {apa}
              </pre>
              <details style={{ marginTop: 10 }}>
                <summary>BibTeX</summary>
                <pre className="cite" style={{ marginTop: 8 }}>
                  {bibtex}
                </pre>
              </details>
            </div>
          </div>
          <p className="actions" style={{ marginTop: 20 }}>
            <Link className="btn" href="/resources/">
              All documents, data and resources
            </Link>
          </p>
        </div>
      </section>

    </>
  );
}
