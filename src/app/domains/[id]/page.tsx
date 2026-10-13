import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { framework, gateName, humanise, research, sourceUrl } from "@/lib/data";
import { controlDetail } from "@/lib/controls";
import { domainIndex } from "@/lib/domains";
import { ControlFilter } from "@/components/ControlFilter";

export const dynamicParams = false;

export function generateStaticParams() {
  return framework.domains.map((d) => ({ id: d.id.toLowerCase() }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const d = framework.domains.find((x) => x.id === id.toUpperCase());
  if (!d) return {};
  return {
    title: `${d.id}: ${d.name}`,
    description: `The ${d.families} families and ${d.controls} controls of the AIDCF ${d.name} domain, with their requirements, evidence classes and critical gates.`,
  };
}

export default async function DomainPage({ params }: Props) {
  const { id } = await params;
  const code = id.toUpperCase();
  const index = framework.domains.findIndex((x) => x.id === code);
  if (index < 0) notFound();
  const d = framework.domains[index];
  const prev = framework.domains[(index + framework.domains.length - 1) % framework.domains.length];
  const next = framework.domains[(index + 1) % framework.domains.length];
  const cluster = framework.clusters.find((c) => c.domains.includes(code))!;
  const guide = research.artifacts.find((a) => a.id === `AIDCF-018-${code}`)?.path ?? null;
  const v = controlDetail.vocab;

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">
            <Link href="/domains/">15 domains</Link> · {cluster.name}
          </p>
          <h1>
            <span className="mono">{d.id}</span> {d.name}
          </h1>
          <p className="lede">
            {d.families} families and {d.controls} controls. Critical to{" "}
            {d.gates.length ? d.gates.map((g) => `${g} ${gateName(g)}`).join(", ") : "no gate"}.
          </p>
          <p className="actions">
            {guide && (
              <a className="btn primary" href={sourceUrl(guide)}>
                {d.id} domain guide
              </a>
            )}
            <Link className="btn" href={`/domains/#${d.id}`}>
              See it in the explorer
            </Link>
          </p>
          <div className="notice" role="note">
            <p>
              <strong>Proposed text.</strong> Requirements are from registry v{controlDetail.registryVersion} (status{" "}
              {controlDetail.registryStatus}), proposed under amendment AMD-002. Intervals and thresholds are set by
              the assessed organisation in its capability profile. The approved v1.0 baseline uses the same identifiers.
            </p>
          </div>
        </div>
      </section>

      <section className="block" aria-label="Families and controls">
        <div className="wrap">
          <ControlFilter total={d.controls} />
          <nav aria-label="Families" className="dx-toc">
            <ul>
              {domainIndex[code].map((f) => (
                <li key={f.id}>
                  <a href={`#${f.id}`}>
                    <span className="mono">{f.id}</span> {f.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {domainIndex[code].map((f) => (
            <section key={f.id} id={f.id} className="dx-fam" aria-labelledby={`${f.id}-h`}>
              <h2 id={`${f.id}-h`}>
                <span className="mono">{f.id}</span> {f.name}
              </h2>
              {f.controls.map((c) => {
                const x = controlDetail.controls[c.id];
                return (
                  <article key={c.id} id={c.id} className="card dx-control">
                    <h3>
                      <span className="mono">{c.id}</span> {c.title}
                    </h3>
                    <p className="dx-tags small">
                      <span title={v.claimTypes[x.claimType]}>Claim {humanise(x.claimType).toLowerCase()}</span>
                      <span>Assurance level {x.assuranceLevel}</span>
                      <span>Tier {x.tier}</span>
                      <span title={v.sufficiency[x.sufficiencyFloor]}>Evidence floor {x.sufficiencyFloor}</span>
                      {c.critical.map((g) => (
                        <span key={g} className="crit" title={gateName(g)}>
                          Critical to {g}
                        </span>
                      ))}
                      {c.supporting.length > 0 && <span>Supports {c.supporting.join(", ")}</span>}
                    </p>
                    <p>
                      <strong>Objective.</strong> {x.objective}
                    </p>
                    <details>
                      <summary>Requirement and evidence</summary>
                      <p>{x.requirement}</p>
                      <p className="small muted">
                      Evidence required: {x.requiredClasses.map((e) => `${e} ${v.evidenceClasses[e] ?? ""}`.trim()).join("; ")}
                      {x.optionalClasses.length ? `. Optional: ${x.optionalClasses.join(", ")}` : ""}. Operating states:{" "}
                      {x.stateCoverage.join(", ")}.
                      </p>
                    </details>
                  </article>
                );
              })}
            </section>
          ))}

          <nav className="dx-pager" aria-label="Other domains">
            <Link href={`/domains/${prev.id.toLowerCase()}/`}>
              ← <span className="mono">{prev.id}</span> {prev.name}
            </Link>
            <Link href={`/domains/${next.id.toLowerCase()}/`}>
              <span className="mono">{next.id}</span> {next.name} →
            </Link>
          </nav>
          <p className="caption">
            Source: <a href={sourceUrl("registries/controls/controls.csv")}>controls.csv</a>,{" "}
            <a href={sourceUrl("registries/controls/evidence-profiles.csv")}>evidence-profiles.csv</a> and{" "}
            <a href={sourceUrl("registries/controls/gate-mappings.csv")}>gate-mappings.csv</a>.
          </p>
        </div>
      </section>
    </>
  );
}
