"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { framework, gateName } from "@/lib/data";
import { domainIndex } from "@/lib/domains";

const domainsById = new Map(framework.domains.map((d) => [d.id, d]));

// Critical gates each domain feeds, counted from the per-control CRITICAL mappings.
const criticalGates = new Map(
  framework.domains.map((d) => {
    const counts = new Map<string, number>();
    for (const f of domainIndex[d.id]) for (const c of f.controls) for (const g of c.critical) counts.set(g, (counts.get(g) ?? 0) + 1);
    return [d.id, counts];
  }),
);

const sharedGates = (a: string, b: string) => [...criticalGates.get(a)!.keys()].filter((g) => criticalGates.get(b)!.has(g)).sort();

export function DomainExplorer() {
  const [selected, setSelected] = useState<string>("POW");
  const [gate, setGate] = useState<string>("");

  // A link such as /domains/#THM opens that domain.
  useEffect(() => {
    const read = () => {
      const id = window.location.hash.slice(1).toUpperCase();
      if (domainsById.has(id)) {
        setSelected(id);
        setGate("");
      }
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const choose = (id: string) => {
    setSelected(id);
    setGate("");
    history.replaceState(null, "", `#${id}`);
  };

  const linked = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const d of framework.domains) if (d.id !== selected) m.set(d.id, sharedGates(selected, d.id));
    return m;
  }, [selected]);

  const domainClass = (id: string) => {
    const c = ["dx-domain"];
    if (gate) {
      if (criticalGates.get(id)!.has(gate)) c.push("in-gate");
      else c.push("dim");
    } else if (id === selected) c.push("selected");
    else if ((linked.get(id) ?? []).length) c.push("linked");
    else c.push("dim");
    return c.join(" ");
  };

  const d = domainsById.get(selected)!;
  const cluster = framework.clusters.find((c) => c.domains.includes(selected))!;
  const families = domainIndex[selected];
  const gateList = [...criticalGates.get(selected)!.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const partners = [...linked.entries()].filter(([, g]) => g.length).sort((a, b) => b[1].length - a[1].length);
  const gateDomains = gate ? framework.domains.filter((x) => criticalGates.get(x.id)!.has(gate)) : [];

  return (
    <div>
      <div className="toolbar">
        <label htmlFor="gate-filter">Show the domains behind a critical gate</label>
        <select id="gate-filter" value={gate} onChange={(e) => setGate(e.target.value)}>
          <option value="">No gate: explore by domain</option>
          {framework.gates.map((g) => (
            <option key={g.id} value={g.id}>
              {g.id}: {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="explorer">
        <div>
          <ol className="dx-map" aria-label="Domain clusters, from direction to assurance integrity">
            {framework.clusters.map((c, i) => (
              <li key={c.name} className="dx-cluster">
                <div className="dx-cluster-head">
                  <span className="dx-step" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <h3>{c.name}</h3>
                    <p className="small muted">{c.rationale}</p>
                  </div>
                </div>
                <ul className="dx-domains">
                  {c.domains.map((id) => {
                    const x = domainsById.get(id)!;
                    const shared = linked.get(id) ?? [];
                    return (
                      <li key={id} id={id} className="dx-anchor">
                        <button type="button" className={domainClass(id)} aria-pressed={id === selected && !gate} onClick={() => choose(id)}>
                          <span className="code">{id}</span>
                          <span className="dx-name">{x.name}</span>
                          <span className="meta">
                            {gate
                              ? criticalGates.get(id)!.has(gate)
                                ? `${criticalGates.get(id)!.get(gate)} critical control${criticalGates.get(id)!.get(gate) === 1 ? "" : "s"} in ${gate}`
                                : `not critical to ${gate}`
                              : id === selected
                                ? "selected"
                                : shared.length
                                  ? `shares ${shared.length} gate${shared.length === 1 ? "" : "s"}`
                                  : "no shared critical gate"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
          <div className="legend" aria-hidden="true">
            <span>
              <i className="sw sel" /> selected domain
            </span>
            <span>
              <i className="sw link" /> shares a critical gate with it
            </span>
          </div>
        </div>

        <div className="panel" role="region" aria-live="polite" aria-label="Domain details">
          {gate ? (
            <>
              <p className="eyebrow" style={{ margin: 0 }}>
                Critical gate {gate}
              </p>
              <h3>{gateName(gate)}</h3>
              <p className="small muted">{framework.gates.find((g) => g.id === gate)?.scope}</p>
              {gateDomains.length === 0 ? (
                <p>No control is mapped CRITICAL to this gate. It is a meta-gate, evaluated on its own criteria.</p>
              ) : (
                <p>
                  {gateDomains.length} domain{gateDomains.length === 1 ? " holds" : "s hold"} CRITICAL controls for this
                  gate. Under the AIDCF-010 roll-up rule the gate cannot PASS unless every one of those controls is
                  CONFORMING{gateDomains.length > 1 ? ", so no domain can pass it on its own" : ""}.
                </p>
              )}
              <ul>
                {gateDomains.map((x) => (
                  <li key={x.id}>
                    <button type="button" className="linklike" onClick={() => choose(x.id)}>
                      {x.id} {x.name}
                    </button>{" "}
                    <span className="small muted">({criticalGates.get(x.id)!.get(gate)} critical)</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="eyebrow" style={{ margin: 0 }}>
                {cluster.name}
              </p>
              <h3>
                <span className="mono">{d.id}</span> {d.name}
              </h3>
              <p className="small muted">
                {d.families} families · {d.controls} controls · {d.criticalMappings} critical and {d.supportingMappings}{" "}
                supporting gate mappings
              </p>
              <p className="actions" style={{ margin: "10px 0" }}>
                <Link className="btn primary" href={`/domains/${d.id.toLowerCase()}/`}>
                  All {d.controls} controls
                </Link>
              </p>

              <h4>Critical gates this domain feeds</h4>
              {gateList.length ? (
                <ul>
                  {gateList.map(([g, n]) => (
                    <li key={g}>
                      <button type="button" className="linklike" onClick={() => setGate(g)}>
                        {g} {gateName(g)}
                      </button>{" "}
                      <span className="small muted">({n} control{n === 1 ? "" : "s"})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="small">None.</p>
              )}

              <h4>Connected domains</h4>
              <p className="small" style={{ marginBottom: 6 }}>
                Domains that hold critical controls for the same gates. A failure here is judged together with them.
              </p>
              <ul className="plain">
                {partners.slice(0, 8).map(([id, g]) => (
                  <li key={id}>
                    <button type="button" className="linklike" onClick={() => choose(id)}>
                      {id} {domainsById.get(id)!.name}
                    </button>{" "}
                    <span className="small muted">({g.join(", ")})</span>
                  </li>
                ))}
                {partners.length > 8 && <li className="small muted">and {partners.length - 8} more</li>}
              </ul>

              <h4>Families</h4>
              {families.map((f) => (
                <details key={f.id} className="dx-family">
                  <summary>
                    <span className="mono">{f.id}</span> {f.name}
                  </summary>
                  <ul>
                    {f.controls.map((c) => (
                      <li key={c.id}>
                        <Link href={`/domains/${d.id.toLowerCase()}/#${c.id}`}>
                          <span className="mono small">{c.id}</span> {c.title}
                        </Link>
                        {c.critical.length > 0 && <span className="small"> · critical to {c.critical.join(", ")}</span>}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
