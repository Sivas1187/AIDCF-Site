import type { Metadata } from "next";
import Link from "next/link";
import { caseData, framework, manifest, repoUrl, research, shortCommit, sourceUrl } from "@/lib/data";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "The AIDCF repository, framework documents, domain guides, machine-readable registries, the synthetic reference implementation, errata, and how to review or contribute.",
};

const registries = [
  { path: "registries/domains/domains.csv", label: "Domains", note: "15 domains and the gates each feeds" },
  { path: "registries/families/control-families.csv", label: "Control families", note: "90 families, six per domain" },
  { path: "registries/controls/controls.csv", label: "Controls", note: "360 controls with requirement, claim type and floors" },
  { path: "registries/controls/evidence-profiles.csv", label: "Evidence profiles", note: "Required evidence for each control" },
  { path: "registries/controls/gate-mappings.csv", label: "Gate mappings", note: "CRITICAL and SUPPORTING control-to-gate roles" },
  { path: "registries/gates/critical-gates.csv", label: "Critical gates", note: "Scope, evidence floor and ceilings" },
  { path: "registries/gates/critical-gate-criteria.csv", label: "Gate criteria", note: "Pass criteria for each gate" },
  { path: "registries/vocabularies", label: "Controlled vocabularies", note: "Decision states, evidence classes and more", tree: true },
];

export default function ResourcesPage() {
  const core = research.artifacts.filter((a) => !/^AIDCF-018-/.test(a.id));
  const guides = framework.domains.map((d) => ({ d, path: research.artifacts.find((a) => a.id === `AIDCF-018-${d.id}`)?.path }));
  const author = research.citation.authors[0];
  const authorName = author ? `${author.given} ${author.family}` : "";
  const impl = caseData.package.dir;

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">Resources</p>
          <h1>Everything behind the site</h1>
          <p className="lede">
            The GitHub repository is the canonical source of AIDCF. Every page here is generated from release{" "}
            <span className="mono">{manifest.release}</span> at commit <span className="mono">{shortCommit}</span>, and
            every link below points at that commit so it matches what you read.
          </p>
          <p className="actions">
            <a className="btn primary" href={repoUrl}>
              GitHub repository
            </a>
            <a className="btn" href={`${repoUrl}/tree/${manifest.commit}`}>
              Browse at commit {shortCommit}
            </a>
            <a className="btn" href={sourceUrl("ERRATA.md")}>
              Errata
            </a>
            <a className="btn" href={sourceUrl("CHANGELOG.md")}>
              Changelog
            </a>
          </p>
        </div>
      </section>

      <section className="block" aria-labelledby="docs-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">1</span>
            <h2 id="docs-h">Framework documents</h2>
            <p>The technical standards and guides, with their version and review status.</p>
          </div>
          <div className="table-scroll">
            <table className="table stack">
              <caption className="visually-hidden">AIDCF artifacts with version and status</caption>
              <thead>
                <tr>
                  <th scope="col">Artifact</th>
                  <th scope="col">Covers</th>
                  <th scope="col">Version</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {core.map((a) => (
                  <tr key={a.path}>
                    <td data-label="Artifact">
                      <a href={sourceUrl(a.path)}>
                        <span className="mono">{a.id}</span> {a.title}
                      </a>
                      {core.filter((b) => b.id === a.id).length > 1 && <div className="small muted mono">{a.path.split("/").pop()}</div>}
                    </td>
                    <td data-label="Covers">{a.summary}</td>
                    <td data-label="Version" className="mono">
                      {a.version || "–"}
                    </td>
                    <td data-label="Status">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="guides-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">2</span>
            <h2 id="guides-h">Domain guides (AIDCF-018)</h2>
            <p>
              One practitioner guide per domain. The <Link href="/domains/">domain explorer</Link> shows each domain&apos;s
              controls on this site.
            </p>
          </div>
          <ul className="domain-grid" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {guides.map(({ d, path }) => (
              <li className="domain" key={d.id}>
                <span className="code">{d.id}</span>
                <span>{d.name}</span>
                <span className="small">
                  {path && (
                    <a href={sourceUrl(path)}>
                      Guide<span className="visually-hidden"> for {d.name}</span>
                    </a>
                  )}
                  {path && " · "}
                  <Link href={`/domains/${d.id.toLowerCase()}/`}>
                    Controls<span className="visually-hidden"> of {d.name}</span>
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="block" aria-labelledby="data-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">3</span>
            <h2 id="data-h">Machine-readable data and reference implementation</h2>
          </div>
          <div className="grid-2">
            <div className="card">
              <h3>Registries</h3>
              <ul>
                {registries.map((r) => (
                  <li key={r.path}>
                    <a href={sourceUrl(r.path, r.tree ? "tree" : "blob")}>{r.label}</a> <span className="small muted">{r.note}</span>
                  </li>
                ))}
              </ul>
              <p className="small muted">
                CSV editions of registry v1.1, which is proposed and not yet approved. If a CSV and the v1.1 workbook
                differ, the workbook governs.
              </p>
            </div>
            <div className="card">
              <h3>Reference implementation (AIDCF-015 v{caseData.package.version})</h3>
              <p>
                A synthetic dataset that instantiates the full assurance chain, with schemas, SHACL shapes and a
                validation suite. It is what the <Link href="/case/">infrastructure graph</Link> is built from.
              </p>
              <ul>
                <li>
                  <a href={sourceUrl(impl, "tree")}>Package</a> and <a href={sourceUrl(`${impl}/README.md`)}>guide</a>
                </li>
                <li>
                  <a href={sourceUrl("schemas", "tree")}>Schemas</a> (JSON Schema, JSON-LD context, OWL, SHACL)
                </li>
                <li>
                  <a href={sourceUrl(`${impl}/outputs`, "tree")}>Validation results</a>
                </li>
              </ul>
              <p className="small muted">Synthetic data only. It describes no real facility.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="block" id="about" aria-labelledby="about-h">
        <div className="wrap">
          <div className="section-head">
            <span className="num">4</span>
            <h2 id="about-h">About</h2>
          </div>
          <div className="grid-2">
            <div className="card">
              <h3>Author</h3>
              <p>
                AIDCF is written and maintained by {authorName}. It is published openly so that it can be challenged,
                tested and improved before anyone relies on it.
              </p>
              <p>
                <Link href="/#research">How to cite AIDCF</Link>
              </p>
            </div>
            <div className="card">
              <h3>Companion project</h3>
              <p>
                <a href="https://aitrustgraph.org">AI Trust Graph</a> reasons about trust, authority and evidence in AI
                systems. AIDCF covers the infrastructure those systems run on. The{" "}
                <a href={sourceUrl(research.artifacts.find((a) => a.id === "AIDCF-005")?.path ?? "")}>AIDCF-005 integration standard</a>{" "}
                defines how the two exchange references, evidence and decisions.
              </p>
            </div>
            <div className="card">
              <h3>Review and contribute</h3>
              <p>
                Specialists in power, cooling, HPC and AI infrastructure, OT security and assurance are invited to
                review the framework. Open an issue using the review-finding template, or read the{" "}
                <a href={`${repoUrl}/blob/main/CONTRIBUTING.md`}>contributing guide</a>.
              </p>
              <p>
                <a className="btn" href={`${repoUrl}/issues/new/choose`}>
                  Submit a review finding
                </a>
              </p>
            </div>
            <div className="card">
              <h3>What AIDCF is not</h3>
              <p>
                It is not a certification scheme, a standard issued by a standards body, or a product. It does not
                issue badges, and its decisions are bounded statements about a defined capability, evidence and date.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
