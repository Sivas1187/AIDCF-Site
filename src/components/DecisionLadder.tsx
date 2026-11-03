import { framework } from "@/lib/data";

// The five decision states as an ordered ladder, strongest at the top (AIDCF-010 order).
// Gate and UNKNOWN ceilings land on a rung; the lowest one reached is the decision.
export function DecisionLadder() {
  const states = framework.decisionStates;
  return (
    <figure className="ladder">
      <p className="matrix-cap">
        <span className="tag-structure">Method structure</span>
        A gate that fails, is UNKNOWN or is not assessed sets a ceiling on this ladder, and so does an open UNKNOWN
        record. The lowest ceiling reached is the decision. Nothing is averaged.
      </p>
      <div className="ladder-body">
        <div className="ladder-axis" aria-hidden="true">
          <span>stronger</span>
          <span className="ladder-arrow" />
          <span>more restrictive</span>
        </div>
        <ol className="ladder-rungs" aria-label="The five decision states, from strongest to most restrictive">
          {states.map((d, i) => (
            <li key={d.code} className={`rung r-${d.code.toLowerCase()}`} style={{ "--i": i } as React.CSSProperties}>
              <span className={`state s-${d.code.toLowerCase()}`}>{d.code}</span>
              <span className="rung-meaning">{d.meaning}.</span>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}
