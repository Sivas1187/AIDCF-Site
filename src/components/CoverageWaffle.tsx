import { caseData, framework } from "@/lib/data";
import { domainIndex } from "@/lib/domains";

// Every control in the registry as one square: a row per domain, a column per control in
// registry order. The squares the synthetic case assessed are filled. It shows how small
// "3.06% coverage" is, so the number cannot be read as a strong result.
const CELL = 11;
const GAP = 3;
const LABEL_W = 38;

export function CoverageWaffle() {
  const cov = caseData.score.coverage;
  const rows = framework.domains.map((d) => ({
    id: d.id,
    controls: domainIndex[d.id].flatMap((f) => f.controls.map((c) => c.id)),
  }));
  const cols = Math.max(...rows.map((r) => r.controls.length));
  const width = LABEL_W + cols * (CELL + GAP);
  const height = rows.length * (CELL + GAP);
  const result = (id: string) => caseData.controls[id]?.result ?? "NOT_ASSESSED";
  const label = `${cov.inScopeCount} controls, one square each, a row per domain. ${cov.assessedCount} were assessed in the synthetic case: ${cov.scoredCount} scored and ${cov.unknownCount} UNKNOWN. The other ${cov.notAssessedCount} were not assessed.`;

  return (
    <figure className="waffle">
      <figcaption className="waffle-cap">
        <span className="story-tag">Synthetic data</span>
        <b>
          {cov.assessedCount} of {cov.inScopeCount}
        </b>{" "}
        controls assessed in the synthetic case
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        {rows.map((r, y) => (
          <g key={r.id} transform={`translate(0,${y * (CELL + GAP)})`}>
            <text className="waffle-row" x={0} y={CELL - 1}>
              {r.id}
            </text>
            {r.controls.map((id, x) => {
              const res = result(id);
              const cls = res === "NOT_ASSESSED" ? "w-open" : res === "UNKNOWN" ? "w-unknown" : "w-scored";
              return (
                <rect key={id} className={cls} x={LABEL_W + x * (CELL + GAP)} y={0} width={CELL} height={CELL} rx={2}>
                  {res !== "NOT_ASSESSED" && <title>{`${id}: ${res.toLowerCase().replace(/_/g, " ")}`}</title>}
                </rect>
              );
            })}
          </g>
        ))}
      </svg>
      <p className="legend waffle-legend" aria-hidden="true">
        <span>
          <i className="w-scored" /> scored ({cov.scoredCount})
        </span>
        <span>
          <i className="w-unknown" /> assessed, UNKNOWN ({cov.unknownCount})
        </span>
        <span>
          <i className="w-open" /> not assessed ({cov.notAssessedCount})
        </span>
      </p>
    </figure>
  );
}
