import Link from "next/link";
import { framework } from "@/lib/data";
import { domainIndex } from "@/lib/domains";

// Which domains hold controls for which critical gates: a row per domain (in the seven
// clusters of whitepaper section 8), a column per gate. A filled cell gives the number of
// CRITICAL control mappings; a light cell means SUPPORTING mappings only. Counted from
// the per-control gate mappings, so it shows how the method is built, not any result.
export function DomainGateMatrix() {
  const gates = framework.gates;
  const count = (domain: string, gate: string, role: "critical" | "supporting") =>
    domainIndex[domain].reduce((n, f) => n + f.controls.filter((c) => c[role].includes(gate)).length, 0);
  const groups = framework.clusters.map((c) => ({
    name: c.name,
    domains: c.domains.map((id) => framework.domains.find((d) => d.id === id)!),
  }));
  const meta = gates.filter((g) => g.critical + g.supporting === 0);

  return (
    <figure className="matrix">
      <p className="matrix-cap">
        <span className="tag-structure">Method structure</span>
        Each domain feeds several gates, and each gate draws on several domains.
      </p>
      <div className="matrix-scroll">
        <table className="dg-matrix">
          <caption className="visually-hidden">
            Critical control mappings by domain and critical gate. A number is the count of CRITICAL controls; a light
            cell means supporting controls only.
          </caption>
          <thead>
            <tr>
              <td />
              {gates.map((g) => (
                <th key={g.id} scope="col" title={`${g.id} ${g.name}`}>
                  <span aria-hidden="true">{g.id.slice(3)}</span>
                  <span className="visually-hidden">
                    {g.id} {g.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          {groups.map((grp) => (
            <tbody key={grp.name}>
              {grp.domains.map((d) => (
                <tr key={d.id}>
                  <th scope="row" title={d.name}>
                    <Link href={`/domains/${d.id.toLowerCase()}/`}>
                      {d.id}
                      <span className="visually-hidden"> {d.name}</span>
                    </Link>
                  </th>
                  {gates.map((g) => {
                    const crit = count(d.id, g.id, "critical");
                    const sup = crit ? 0 : count(d.id, g.id, "supporting");
                    return (
                      <td
                        key={g.id}
                        className={crit ? "c-crit" : sup ? "c-sup" : g.critical + g.supporting === 0 ? "c-meta" : undefined}
                        title={crit ? `${d.id} → ${g.id}: ${crit} critical` : sup ? `${d.id} → ${g.id}: supporting only` : undefined}
                      >
                        {crit ? crit : <span className="visually-hidden">{sup ? "supporting only" : "none"}</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <p className="legend matrix-legend" aria-hidden="true">
        <span>
          <i className="c-crit" /> number of critical controls
        </span>
        <span>
          <i className="c-sup" /> supporting controls only
        </span>
        {meta.length > 0 && (
          <span>
            <i className="c-meta" /> {meta.map((g) => g.id).join(" and ")}: meta-gates on evidence and UNKNOWNs, no
            control mappings
          </span>
        )}
      </p>
      <ol className="gate-key">
        {gates.map((g) => (
          <li key={g.id}>
            <Link href={`/method/#${g.id.toLowerCase()}`}>
              <span className="mono">{g.id.slice(3)}</span> {g.name}
            </Link>
          </li>
        ))}
      </ol>
    </figure>
  );
}
