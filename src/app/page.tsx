import Link from "next/link";
import { ChainVisual } from "@/components/ChainVisual";
import { CoverageWaffle } from "@/components/CoverageWaffle";
import { DecisionLadder } from "@/components/DecisionLadder";
import { DomainGateMatrix } from "@/components/DomainGateMatrix";
import { FailurePathGraph } from "@/components/FailurePathGraph";
import { FailureStory } from "@/components/FailureStory";
import { StageGates } from "@/components/StageGates";
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
  const ir = validation.independentReview;
  const conf = research.conformance;
  const registryProposed = /PROPOSED/.test(research.baseline ?? "");
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
            {/* Fixed wording: reviews received are not independent validation. Change only on an explicit,
                justified validation status. */}
            · Independent validation pending
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
          <div className="card">
            <h3>The question AIDCF answers</h3>
            <p>
              Can this specific AI capability, under these operating conditions, deliver its required outcomes, and
              what is the evidence?
            </p>
          </div>
          <p className="more">
            <Link href="/method/#reviews">What common reviews establish, and what they may leave open for an AI workload</Link>
          </p>
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
          <div className="notice" role="note" style={{ marginTop: 16 }}>
            <p>
              <strong>Untested claim.</strong> Whether AIDCF finds weaknesses that existing reviews miss has not been
              tested. See <Link href="/method/#compare">how AIDCF sits alongside specialist reviews</Link> and the{" "}
              <a href={sourceUrl(bt.draftProtocol)}>draft comparative protocol</a> designed to test it.
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
          <DecisionLadder />
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
              AIDCF-009 Part A describes an eight-phase assessment lifecycle governed by stage gates SG0 to SG7, with
              defined review and approval responsibilities. Reassessment is triggered by relevant changes or events. An
              assessment can be run first-party, co-sourced, second-party or by an independent third party. Its length
              depends on scope and evidence access; no typical duration is claimed.
            </p>
          </div>
          <StageGates />
          <p className="caption">
            Source: <a href={sourceUrl(handbook)}>AIDCF-009 Part A practitioner handbook</a> (draft for controlled
            review). Roles, separation rules and the{" "}
            <Link href="/method/#outputs">work products an assessment is designed to produce</Link> are in the method
            detail.
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
            <CoverageWaffle />
            <Link className="btn primary" href="/case/">
              Trace the failures and the evidence
            </Link>
          </div>
          <h3 style={{ marginTop: 32 }}>One failure, drawn as a graph</h3>
          <FailurePathGraph />
        </div>
      </section>

      <section className="block" id="domains" aria-labelledby="domains-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">07</span>
            <h2 id="domains-h">Fifteen domains, fifteen critical gates</h2>
            <p>
              Domains organise the assessment work and give every concern an owner. They do not partition the
              argument: the gates cut across them, so a weakness in one domain is judged together with the others.
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
          <DomainGateMatrix />
          <p className="actions" style={{ marginTop: 16 }}>
            <Link className="btn primary" href="/domains/">
              Open the domain explorer
            </Link>
            <Link className="btn" href="/method/#gates">
              Gate criteria, evidence floors and ceilings
            </Link>
          </p>
        </div>
      </section>

      <section className="block" id="validation" aria-labelledby="validation-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">08</span>
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
          <p className="more">
            <Link href="/method/#instruments">The four validation instruments and where each stands</Link>
          </p>
        </div>
      </section>

      <section className="block" id="research" aria-labelledby="research-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">09</span>
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
