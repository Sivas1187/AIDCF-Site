"use client";

import { useEffect, useState } from "react";

type Option = { value: string; label: string };

// Filters the scenario cards rendered on the scenarios page by text, domain, gate and operating state.
export function ScenarioFilter({ total, domains, gates, states }: { total: number; domains: Option[]; gates: Option[]; states: string[] }) {
  const [q, setQ] = useState("");
  const [domain, setDomain] = useState("");
  const [gate, setGate] = useState("");
  const [state, setState] = useState("");
  const [shown, setShown] = useState(total);

  // A link such as /scenarios/#POW pre-selects that domain.
  useEffect(() => {
    const id = window.location.hash.slice(1).toUpperCase();
    if (domains.some((d) => d.value === id)) setDomain(id);
  }, [domains]);

  useEffect(() => {
    const needle = q.trim().toLowerCase();
    let n = 0;
    for (const el of document.querySelectorAll<HTMLElement>(".sc-card")) {
      const has = (attr: string, v: string) => !v || (el.dataset[attr] ?? "").split(" ").includes(v);
      const hit =
        has("domains", domain) && has("gates", gate) && has("states", state) && (!needle || (el.textContent ?? "").toLowerCase().includes(needle));
      el.hidden = !hit;
      if (hit) n++;
    }
    setShown(n);
  }, [q, domain, gate, state]);

  const reset = () => {
    setQ("");
    setDomain("");
    setGate("");
    setState("");
  };

  return (
    <div className="toolbar dx-filter sc-filter">
      <div className="sc-field">
        <label htmlFor="sc-q">Search</label>
        <input id="sc-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. firmware, leak, checkpoint" autoComplete="off" />
      </div>
      <div className="sc-field">
        <label htmlFor="sc-domain">Domain on the path</label>
        <select id="sc-domain" value={domain} onChange={(e) => setDomain(e.target.value)}>
          <option value="">Any domain</option>
          {domains.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sc-field">
        <label htmlFor="sc-gate">Critical gate</label>
        <select id="sc-gate" value={gate} onChange={(e) => setGate(e.target.value)}>
          <option value="">Any gate</option>
          {gates.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sc-field">
        <label htmlFor="sc-state">Operating state</label>
        <select id="sc-state" value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">Any state</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <span className="small muted" role="status">
        {shown === total ? `${total} scenarios` : `${shown} of ${total} scenarios`}
      </span>
      {shown !== total && (
        <button type="button" className="linklike small" onClick={reset}>
          Clear filters
        </button>
      )}
    </div>
  );
}
