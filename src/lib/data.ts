// Typed access to the generated content in src/data/. Nothing in this file
// states a framework fact; it only reads what scripts/build-content.mjs wrote.

import manifestJson from "@/data/manifest.json";
import frameworkJson from "@/data/framework.json";
import caseJson from "@/data/case.json";
import validationJson from "@/data/validation.json";
import researchJson from "@/data/research.json";

export const manifest = manifestJson;
export const framework = frameworkJson;
export const research = researchJson;
export const validation = validationJson;

export type NodeKind = "external" | "asset" | "system" | "function" | "outcome";

export interface CaseNode {
  id: string;
  iri: string;
  kind: NodeKind;
  type: string;
  name: string;
  domain: string | null;
  detail: string | null;
  tolerance: string | null;
  operatingStates: string[];
  unknowns: string[];
  exposedTo: string[];
}

export interface CaseEdge {
  from: string;
  to: string;
  kind: "composes" | "implements" | "requires" | "depends" | "propagates";
  label: string | null;
  dependency?: string;
}

export interface ControlSummary {
  id: string;
  title: string;
  domain: string;
  gates: { gate: string; role: string }[];
  result: string;
  claimType: string | null;
  sufficiency: string | null;
  rationale: string | null;
  assessment: string | null;
  findings: string[];
  unknowns: string[];
}

export interface CaseData {
  capability: {
    id: string;
    name: string;
    boundary: string;
    demandProfile: string;
    operatingEnvelope: string;
    workload: string[];
    criticality: string;
  };
  outcomes: { id: string; name: string; measure: string; tolerance: string; states: string[] }[];
  nodes: CaseNode[];
  edges: CaseEdge[];
  faultDomains: { id: string; commonMode: string; blastRadius: string; boundary: string; members: string[] }[];
  dependencies: { id: string; name: string; type: string; external: boolean; faultDomain: string | null }[];
  initiators: { id: string; type: string; name: string; mechanism: string | null; scenarios: string[]; exposed: string[] }[];
  scenarios: {
    id: string;
    name: string;
    preState: string;
    residualState: string;
    confidence: string;
    initiatedBy: string[];
    steps: { from: string; to: string }[];
    safeguards: string[];
    effects: { outcome: string; effect: string; exceedsTolerance: boolean }[];
    restricted: boolean;
  }[];
  safeguards: {
    id: string;
    name: string;
    activation: string;
    trigger: string;
    implementedBy: string[];
    dependsOn: string[];
    controls: string[];
  }[];
  controls: Record<string, ControlSummary>;
  findings: {
    id: string;
    control: string;
    class: string;
    status: string;
    condition: string;
    consequence: string;
    gateEffect: string;
  }[];
  unknowns: {
    id: string;
    name: string;
    severity: string;
    material: boolean;
    subject: string;
    reason: string;
    evidenceNeeded: string;
    decisionEffect: string;
    constrains: string[];
    status: string;
  }[];
  gateResults: {
    gate: string;
    state: string;
    applicability: string;
    sufficiency: string | null;
    rationale: string;
    decisionEffect: string;
    findings: string[];
    evaluations: { control: string; role: string; result: string }[];
    criteria: { id: string; outcome: string }[];
  }[];
  decision: {
    question: string;
    scope: string;
    state: string;
    recommended: string;
    controllingReasons: string[];
    otherCeilings: string | null;
    limitations: string[];
    validUntil: string | null;
    notCertification: boolean;
    approvalNote: string;
  };
  score: {
    band: string;
    bandWithheldReason: string;
    coverage: {
      inScopeCount: number;
      notApplicableCount: number;
      assessedCount: number;
      scoredCount: number;
      unknownCount: number;
      notAssessedCount: number;
      coveragePercent: number;
    };
    meanScore: number | null;
    method: string;
    hash: string;
  };
  summary: {
    fail: string[];
    unknown: string[];
    notAssessed: number;
    pass: number;
    assessed: number;
    scored: number;
    coveragePercent: number;
    unknownRecords: number;
    findings: number;
  };
}

export const caseData = caseJson as unknown as CaseData;

/** A link to a file in the AIDCF repository at the pinned commit. */
export function sourceUrl(path: string, kind: "blob" | "tree" = "blob"): string {
  return `${manifest.repository}/${kind}/${manifest.commit}/${path}`;
}

export const repoUrl = manifest.repository;
export const shortCommit = manifest.commit.slice(0, 7);

export function gateName(id: string): string {
  return framework.gates.find((g) => g.id === id)?.name ?? id;
}

/** Turns codes such as NOT_ASSURED or BMS_CONTROLLER into readable words. */
export function humanise(code: string | null | undefined): string {
  if (!code) return "";
  const lower = code
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-GB");
}

export function percent(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`;
}
