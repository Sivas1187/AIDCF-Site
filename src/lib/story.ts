// The four-stage failure story (Failure, Impact, Evidence, Decision) told on
// the homepage and at the top of the case page. Every value is read from the
// synthetic case data; only the choice of scenario is fixed here.
import { caseData, framework, humanise, type CaseNode, type ControlSummary } from "@/lib/data";

export const STORY_SCENARIO = "FS-04";

const nodeById = new Map(caseData.nodes.map((n) => [n.id, n]));
const clusterOf = new Map(framework.clusters.flatMap((c) => c.domains.map((d) => [d, c.name] as const)));

export function layerLabel(n: CaseNode): string {
  if (n.kind === "function") return "AI service function";
  if (n.kind === "outcome") return "Service outcome";
  if (n.kind === "external") return "External supply";
  return (n.domain && clusterOf.get(n.domain)) || humanise(n.kind);
}

function buildStory() {
  const scenario = caseData.scenarios.find((s) => s.id === STORY_SCENARIO)!;
  const order: string[] = [];
  for (const st of scenario.steps) for (const id of [st.from, st.to]) if (!order.includes(id)) order.push(id);
  const path = order.map((id) => nodeById.get(id)!);
  const hazards = caseData.initiators.filter((i) => scenario.initiatedBy.includes(i.id));
  const effect = scenario.effects[0];
  const outcome = caseData.outcomes.find((o) => o.id === effect?.outcome) ?? null;

  const safeguards = caseData.safeguards
    .filter((s) => scenario.safeguards.includes(s.id))
    .map((s) => ({
      ...s,
      results: s.controls.map((id) => caseData.controls[id]).filter(Boolean) as ControlSummary[],
    }));
  const pathUnknowns = caseData.unknowns.filter((u) => order.includes(u.subject));

  const d = caseData.decision;
  const gate = d.controllingReasons.map((r) => r.match(/CG-\d+/)?.[0]).find(Boolean) ?? null;
  const gateResult = caseData.gateResults.find((g) => g.gate === gate) ?? null;
  // Safeguard controls that are also CRITICAL inputs to the controlling gate tie this failure to the decision.
  const bridge = safeguards
    .flatMap((s) => s.results.map((c) => ({ safeguard: s, control: c })))
    .filter(({ control }) => control.gates.some((g) => g.gate === gate && g.role === "CRITICAL"));
  const findings = caseData.findings.filter((f) => bridge.some((b) => b.control.id === f.control));
  const weakCritical = gateResult?.evaluations.filter((e) => e.role === "CRITICAL" && e.result !== "CONFORMING") ?? [];

  return {
    scenario,
    path,
    hazards,
    effect,
    outcome,
    safeguards,
    pathUnknowns,
    decision: d,
    gate,
    gateResult,
    bridge,
    findings,
    weakCritical,
  };
}

export const story = buildStory();
export const nodeName = (id: string) => nodeById.get(id)?.name ?? id;
