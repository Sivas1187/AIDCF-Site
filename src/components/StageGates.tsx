// A simplified view of the eight-phase AIDCF-009 Part A lifecycle (section 0.6) and its stage
// gates SG0 to SG7 (A6). Phases 1 to 7 are drawn as a track with the gate(s) listed against each;
// SG6 and SG7 share phase 7, and phase 8, Reassess, is drawn as the loop back to SG0 or SG1. It is
// not a one-to-one mapping of phases to gates. Phase wording follows the handbook.
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
        Simplified view of the eight-phase lifecycle governed by stage gates SG0 to SG7. Phases 1 to 7 are shown
        with their gates (SG6 and SG7 both sit in phase 7); phase 8, Reassess, is the loop below.
      </p>
      <ol className="sg-track" aria-label="Simplified assessment lifecycle: phases 1 to 7 and their stage gates">
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
          <b>Phase 8, Reassess.</b> Changes, incidents, evidence expiry and gate result changes trigger a delta or full
          reassessment, with re-entry at <span className="mono">SG0</span> or <span className="mono">SG1</span>.
        </span>
      </p>
    </figure>
  );
}
