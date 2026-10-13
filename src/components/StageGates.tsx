// The AIDCF-009 Part A assessment lifecycle as a stage-gate track: each phase ends at
// its stage gate, and reassessment loops back to SG0 or SG1. Wording follows section 0.6 and A6.
export const phases = [
  { name: "Initiate", gate: "SG0", gateName: "Authorise", what: "Charter the decision question, sponsor, decision authority and intended users." },
  { name: "Profile, scope and tailor", gate: "SG1", gateName: "Scope", what: "Define the capability, its boundary and dependencies, and which controls apply." },
  { name: "Plan", gate: "SG2", gateName: "Plan", what: "Plan the work, rules of engagement, safety approvals, evidence requests and team competence." },
  { name: "Collect and validate", gate: "SG3", gateName: "Fieldwork", what: "Document and configuration review, interviews, inspection, sampling, data analysis and testing." },
  { name: "Assess, analyse, gate and find", gate: "SG4", gateName: "Technical review", what: "Control results, failure scenarios, critical gate results, findings and UNKNOWNs." },
  { name: "Review", gate: "SG5", gateName: "Independent review", what: "An independent reviewer challenges the evidence, gate logic and recommendation." },
  { name: "Decide and report", gate: "SG6 · SG7", gateName: "Decide · Archive", what: "The decision authority issues a bounded decision, or records a decision not to issue one." },
];

export function StageGates() {
  return (
    <figure className="sg">
      <p className="matrix-cap">
        <span className="tag-structure">Method structure</span>
        Each phase closes at a stage gate with defined review and approval responsibilities.
      </p>
      <ol className="sg-track" aria-label="Assessment lifecycle, SG0 to SG7">
        {phases.map((p, i) => (
          <li key={p.gate}>
            <span className="sg-num" aria-hidden="true">
              {i + 1}
            </span>
            <b className="sg-name">{p.name}</b>
            <span className="sg-what">{p.what}</span>
            <span className="sg-gate">
              <span className="sg-diamond" aria-hidden="true" />
              <span className="mono">{p.gate}</span>
              <span className="sg-gname">{p.gateName}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="sg-loop">
        <span className="sg-loop-arrow" aria-hidden="true">
          ↺
        </span>
        <span>
          <b>Reassess.</b> Changes, incidents, evidence expiry and gate result changes re-enter the lifecycle at SG0 or
          SG1, as a delta or full reassessment.
        </span>
      </p>
    </figure>
  );
}
