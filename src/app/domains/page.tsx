import type { Metadata } from "next";
import { DomainExplorer } from "@/components/DomainExplorer";
import { framework, sourceUrl } from "@/lib/data";
import { controlDetail } from "@/lib/controls";

export const metadata: Metadata = {
  title: "15 domains",
  description:
    "Explore the fifteen AIDCF assurance domains, from facility engineering to the AI technology chain: their families, controls, and the critical gates that bind them together.",
};

export default function DomainsPage() {
  const c = framework.counts;
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">
            {c.domains} domains · {c.families} families · {c.controls} controls · {c.gates} critical gates
          </p>
          <h1>From the switchboard to the decision</h1>
          <p className="lede">
            AIDCF splits the assurance work into fifteen domains so every concern has an owner and the right expertise.
            The domains do not split the argument. Power, cooling, compute, network and OT security all feed the same
            critical gates, so a weakness in one is judged together with the others.
          </p>
          <div className="notice" role="note">
            <p>
              <strong>Control text is a proposal.</strong> Control requirements shown here are from registry v
              {controlDetail.registryVersion} (record status {controlDetail.registryStatus}), proposed under amendment
              AMD-002 and not yet approved. The approved baseline is v1.0, with the same control identifiers.
            </p>
          </div>
        </div>
      </section>

      <section className="block" aria-labelledby="explorer-h">
        <div className="wrap wide">
          <div className="section-head">
            <span className="num">1</span>
            <h2 id="explorer-h">Domain explorer</h2>
            <p>
              Domains are grouped into the seven clusters of whitepaper section 8, running from direction and the
              subject of assurance, through the physical site and facility engineering, to the AI technology chain,
              operations, authority and evidence. Select a domain to see the domains it shares critical gates with, or
              pick a gate to see which domains hold its critical controls.
            </p>
          </div>
          <DomainExplorer />
          <p className="caption">
            Clusters from the <a href={sourceUrl(framework.whitepaperMd)}>whitepaper, section 8</a>. Gate links counted
            from <a href={sourceUrl("registries/controls/gate-mappings.csv")}>gate-mappings.csv</a>: {c.critical} CRITICAL
            and {c.supporting} SUPPORTING mappings.
          </p>
        </div>
      </section>
    </>
  );
}
