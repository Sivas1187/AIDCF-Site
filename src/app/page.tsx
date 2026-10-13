import Link from "next/link";
import { ChainVisual } from "@/components/ChainVisual";
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

// Review types and what each does and does not establish for an AI workload.
// This is the project's own analysis (see the impact assessment in the
// repository), not a measured survey.
const reviewGap = [
  {
    review: "Tier certification, ANSI/TIA-942 rating, EN 50600 / ISO/IEC 22237 classification",
    establishes: "Facility design topology and availability class",
    gap: "Whether a training or inference service survives the failures that matter to it, such as loss of a cooling loop at full accelerator load, a fabric partition or a checkpoint-store outage",
  },
  {
    review: "Commissioning and integrated systems testing",
    establishes: "That systems worked at handover",
    gap: "Behaviour after later changes, under real AI load profiles, and through recovery",
  },
  {
    review: "ISO/IEC 27001, SOC 2 and similar reports",
    establishes: "That a security management system or controls exist",
    gap: "Integrity of the building, power and cooling control systems, and their effect on AI outcomes",
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
          Incident back-test under way: {bt.logged} public incidents logged, {bt.eligible} eligible.{" "}
          {bt.selected > 0 ? `${bt.selected} selected for coding.` : "The sample has not been drawn yet."}
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
          <h1>AI capability depends on more than compute.</h1>
          <p className="lede">
            The {research.name} (AIDCF) traces an AI service outcome through the power, cooling, network, storage,
            control systems and suppliers it depends on, to the evidence, the critical gates and an accountable,
            bounded decision.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/case/">
              Explore the synthetic case
            </Link>
            <a className="btn" href={sourceUrl(research.whitepaper.pdf)}>
              Read the whitepaper (PDF)
            </a>
            <a className="btn" href={repoUrl}>
              View on GitHub
            </a>
          </div>
          <div className="notice" role="note">
            <p>
              <strong>A methodology, not a certification or a product.</strong> AIDCF is a validation candidate. It
              has not yet been independently reviewed or used on a real facility, and the example on this site is
              synthetic.
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
        </div>
      </section>

      <section className="block" id="problem" aria-labelledby="problem-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">01</span>
            <h2 id="problem-h">The problem</h2>
            <p>
              A reliable AI service needs dense, transient power, liquid cooling, tightly coupled fabrics, checkpoint
              storage, building control systems and outside suppliers to work together. Today each of these is
              reviewed separately, and nobody joins the results up at the level of the AI workload.
            </p>
          </div>
          <div className="table-scroll">
            <table className="table stack">
              <caption className="visually-hidden">Common review types and the gap each leaves for an AI workload</caption>
              <thead>
                <tr>
                  <th scope="col">Review commonly used today</th>
                  <th scope="col">What it establishes</th>
                  <th scope="col">What it does not establish for an AI workload</th>
                </tr>
              </thead>
              <tbody>
                {reviewGap.map((r) => (
                  <tr key={r.review}>
                    <td data-label="Review">{r.review}</td>
                    <td data-label="Establishes">{r.establishes}</td>
                    <td data-label="Does not establish">{r.gap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="caption">
            The project&rsquo;s own analysis. AIDCF treats existing certifications and reports as bounded evidence, not
            as proof that an AI capability is resilient.
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

      <section className="block" id="method" aria-labelledby="method-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">02</span>
            <h2 id="method-h">How AIDCF reasons</h2>
            <p>
              One chain runs from the decision being made to the decision taken. Every link must be supported, and
              every gap is recorded rather than assumed away.
            </p>
          </div>
          <ChainVisual />
        </div>
      </section>

      <section className="block" id="doctrine" aria-labelledby="doctrine-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">03</span>
            <h2 id="doctrine-h">What makes it different</h2>
          </div>
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

      <section className="block" id="domains" aria-labelledby="domains-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">04</span>
            <h2 id="domains-h">Fifteen assurance domains</h2>
            <p>
              Domains organise the assessment work and give every concern an owner. They do not partition the
              argument: a single failure scenario routinely crosses power, cooling, compute, storage, network,
              operations and security.
            </p>
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
            <span className="num">05</span>
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

      <section className="block" id="case" aria-labelledby="case-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">06</span>
            <h2 id="case-h">A worked synthetic case</h2>
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

      <section className="block" id="validation" aria-labelledby="validation-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">07</span>
            <h2 id="validation-h">Validation status</h2>
            <p>What has been done, what is under way, and what is still needed before anyone should rely on AIDCF.</p>
          </div>
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
                  <td data-label="Question">Would AIDCF have flagged the causes of real, publicly reported outages?</td>
                  <td data-label="State">
                    {bt.logged} incidents logged, {bt.eligible} eligible, {bt.excluded} excluded with reasons.{" "}
                    {bt.selected > 0 ? `${bt.selected} selected.` : "Exclusions are being cross-checked before the sample draw."}
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
            <span className="num">08</span>
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
