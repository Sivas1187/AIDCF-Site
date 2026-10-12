#!/usr/bin/env node
// Generates the site's data files from the canonical AIDCF repository.
//
// The site never hand-copies framework content. Every number, name and
// result shown on the site comes from the JSON files this script writes to
// src/data/, and those files are built from the AIDCF repository at the
// commit pinned in source.json.
//
// Usage:
//   node scripts/build-content.mjs            regenerate src/data/
//   node scripts/build-content.mjs --check    fail if src/data/ is stale
//
// Files are read from git objects at the pinned commit (git show
// <commit>:<path>), not from the working tree. Editing a framework file, or
// checking out another branch, therefore cannot change the site until
// source.json is deliberately moved to a new commit. The repository is the
// AIDCF clone at ../aidcf, or $AIDCF_SRC if set; it needs full history.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const outDir = join(root, "src", "data");
const pin = JSON.parse(readFileSync(join(root, "source.json"), "utf8"));
const src = resolve(process.env.AIDCF_SRC ?? join(root, "..", "aidcf"));
const checkOnly = process.argv.includes("--check");

// ---------------------------------------------------------------- helpers

function fail(message) {
  console.error(`build-content: ${message}`);
  process.exit(1);
}

const git = (...args) => execFileSync("git", ["-C", src, ...args], { maxBuffer: 256 * 1024 * 1024 });

function read(rel) {
  try {
    return git("show", `${pin.commit}:${rel}`);
  } catch {
    fail(`${rel} does not exist at the pinned commit ${pin.commit.slice(0, 7)}`);
  }
}

function listDir(rel) {
  try {
    return git("ls-tree", "--name-only", `${pin.commit}:${rel}`).toString("utf8").split("\n").filter(Boolean);
  } catch {
    fail(`${rel} does not exist at the pinned commit ${pin.commit.slice(0, 7)}`);
  }
}

const sources = new Map();
function track(rel) {
  const buf = read(rel);
  sources.set(rel, createHash("sha256").update(buf).digest("hex"));
  return buf.toString("utf8");
}

// RFC 4180 CSV parser: quoted fields, doubled quotes, embedded newlines.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((r) => r.length > 1 || r[0] !== "");
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

const csv = (rel) => parseCsv(track(rel).replace(/^﻿/, ""));

function jsonld(rel) {
  const doc = JSON.parse(track(rel));
  return Array.isArray(doc) ? doc : doc["@graph"];
}

const short = (iri) => (iri ? String(iri).split(/[:/]/).pop() : iri);
const shorts = (list) => (list ?? []).map(short);
const split = (s) => (s ? s.split(";").map((x) => x.trim()).filter(Boolean) : []);

function assertEq(label, actual, expected) {
  if (actual !== expected) fail(`${label}: expected ${expected}, found ${actual}`);
}

// ---------------------------------------------------------- source pinning

try {
  execFileSync("git", ["-C", src, "cat-file", "-e", `${pin.commit}^{commit}`], { stdio: "ignore" });
} catch {
  fail(`pinned commit ${pin.commit} is not in the repository at ${src}. Fetch full history (fetch-depth: 0) or set AIDCF_SRC.`);
}

// ------------------------------------------------------------ framework

const domains = csv("registries/domains/domains.csv").map((d) => ({
  id: d.domainId,
  name: d.domainName,
  families: Number(d.familyCount),
  controls: Number(d.controlCount),
  gates: split(d.criticalGates),
}));
const families = csv("registries/families/control-families.csv");
const controls = csv("registries/controls/controls.csv");
const gateMappings = csv("registries/controls/gate-mappings.csv");
const gates = csv("registries/gates/critical-gates.csv").map((g) => ({
  id: g.gateId,
  name: g.name,
  scope: g.scope,
  evidenceFloor: g.evidenceFloor,
  failCeiling: g.failCeiling,
  unknownCeiling: g.unknownCeiling,
  owner: g.ownerArtifact,
}));
const gateCriteria = csv("registries/gates/critical-gate-criteria.csv");
const decisionStates = csv("registries/vocabularies/decision-states.csv");

assertEq("domain count", domains.length, 15);
assertEq("family count", families.length, 90);
assertEq("control count", controls.length, 360);
assertEq("gate count", gates.length, 15);

for (const g of gates) {
  g.critical = gateMappings.filter((m) => m.gateId === g.id && m.role === "CRITICAL").length;
  g.supporting = gateMappings.filter((m) => m.gateId === g.id && m.role === "SUPPORTING").length;
  g.criteria = gateCriteria.filter((c) => c.gateId === g.id).length;
}

// Restrictiveness order from AIDCF-010: RA > CA > LIMITED > INCONCLUSIVE > NOT_ASSURED.
const decisionOrder = ["REASONABLY_ASSURED", "CONDITIONALLY_ASSURED", "LIMITED", "INCONCLUSIVE", "NOT_ASSURED"];
const decisionMeaning = Object.fromEntries(decisionStates.map((d) => [d.code, d.meaning]));
for (const code of decisionOrder) if (!decisionMeaning[code]) fail(`decision state ${code} missing`);

// The canonical chain is parsed from the AIDCF-002 step table, not retyped.
const ccmPath = "foundations/conceptual-model/AIDCF-002_Core_Conceptual_Model_v1.0.md";
const ccm = track(ccmPath);
const chain = [];
for (const line of ccm.split("\n")) {
  const m = line.match(/^\| (\d{1,2}|Loop) \| ([^|]+) \| ([^|]+) \| [^|]+ \| ([^|]+) \| [^|]+ \|$/);
  if (m) chain.push({ step: m[1], name: m[2].trim(), question: m[3].trim(), owner: m[4].trim() });
}
assertEq("chain steps", chain.filter((s) => s.step !== "Loop").length, 16);

const framework = {
  domains,
  counts: {
    domains: domains.length,
    families: families.length,
    controls: controls.length,
    gates: gates.length,
    gateMappings: gateMappings.length,
    critical: gateMappings.filter((m) => m.role === "CRITICAL").length,
    supporting: gateMappings.filter((m) => m.role === "SUPPORTING").length,
    gateCriteria: gateCriteria.length,
  },
  gates,
  decisionStates: decisionOrder.map((code) => ({ code, meaning: decisionMeaning[code] })),
  chain,
  chainSource: ccmPath,
};

// ------------------------------------------------------- synthetic case

const ds = "implementation/aidcf-015-v1.3/dataset";
const all = [
  "capability",
  "architecture",
  "failure",
  "assessment",
  "decision",
  "evidence",
  "organisation",
].flatMap((f) => jsonld(`${ds}/${f}.jsonld`));
const rels = jsonld(`${ds}/relationships.jsonld`);
const byId = new Map(all.map((x) => [x.id, x]));
const ofType = (...types) => all.filter((x) => types.includes(x.type));
const relById = new Map(rels.map((r) => [r.id, r]));
const controlById = new Map(controls.map((c) => [c.controlId, c]));
const partyName = (iri) => byId.get(iri)?.name ?? short(iri);

const capability = ofType("CapabilityInstance")[0];
const outcomes = ofType("ServiceOutcome");
const functions = ofType("RequiredFunction");
const systems = ofType("InfrastructureSystem", "IACS");
const assets = ofType("AssetInstance");
const resources = ofType("Resource");
const faultDomains = ofType("FaultDomain");
const dependencies = ofType("Dependency");
const scenarios = ofType("FailureScenario");
const initiators = ofType("FailureMode", "Hazard", "Threat");
const safeguards = ofType("Safeguard");
const assessments = ofType("ControlAssessment");
const findings = ofType("Finding");
const unknowns = ofType("UnknownRecord");
const gateResults = ofType("GateResult");
const decision = ofType("AssuranceDecision")[0];
const recommendation = ofType("DecisionRecommendation")[0];
const score = ofType("ScoreSnapshot")[0];

// Graph nodes, laid out in five columns from upstream cause to outcome.
const column = { external: 0, asset: 1, system: 2, function: 3, outcome: 4 };
const preferredOrder = [
  "AST-UTILITY", "RES-WATER", "CDU-VENDOR",
  "AST-SWB-01", "AST-UPS-A", "AST-UPS-B", "AST-CHL", "AST-CDU-1", "AST-CDU-2", "AST-BMS-CTRL", "AST-OT-GW", "AST-GPU-NODES", "AST-FAB-SPINE", "AST-STO-ARRAY",
  "SYS-POW", "SYS-FWS", "SYS-THM", "SYS-CTL", "SYS-CMP", "SYS-NET", "SYS-STO",
  "RF-01", "RF-02", "RF-06", "RF-03", "RF-05", "RF-04",
  "SO-01", "SO-03", "SO-02",
];
const rank = (id) => {
  const i = preferredOrder.indexOf(id);
  return i === -1 ? preferredOrder.length : i;
};

const nodes = [];
const addNode = (x, kind) => {
  const id = short(x.id);
  nodes.push({
    id,
    iri: x.id,
    kind,
    type: x.type,
    name: x.name.replace(/^Synthetic (\w)/, (_, c) => c.toUpperCase()),
    domain: x.domainCode ?? null,
    detail: x.functionStatement ?? x.description ?? x.measure ?? x.assetKind ?? x.resourceKind ?? null,
    tolerance: x.tolerance ?? null,
    operatingStates: x.operatingStates ?? [],
    unknowns: shorts(x.hasUnknown),
    exposedTo: shorts(x.exposedTo),
  });
};
for (const o of outcomes) addNode(o, "outcome");
for (const f of functions) addNode(f, "function");
for (const s of systems) addNode(s, "system");
for (const a of assets) addNode(a, a.assetKind === "UTILITY_SERVICE" ? "external" : "asset");
for (const r of resources) {
  // Only resources that something propagates from are shown.
  if (r.propagatesTo?.length) addNode(r, "external");
}
const vendorDep = dependencies.find((d) => d.dependencyType === "SUPPLIER");
if (vendorDep) {
  const party = all.find((x) => x.type === "PartyEntity" && short(x.id) === "CDU-VENDOR");
  if (party) addNode({ ...party, description: "External supplier" }, "external");
}
nodes.sort((a, b) => column[a.kind] - column[b.kind] || rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
const nodeIds = new Set(nodes.map((n) => n.id));

// Edges point in the direction failure travels: from the thing relied on
// to the thing that relies on it.
const edges = [];
const edgeKey = new Set();
const addEdge = (from, to, kind, label) => {
  if (!nodeIds.has(from) || !nodeIds.has(to) || from === to) return;
  const key = `${from}>${to}`;
  if (edgeKey.has(key)) return;
  edgeKey.add(key);
  edges.push({ from, to, kind, label: label ?? null });
};
// An IACS is composed of zones, and zones of assets; flatten to asset -> system.
const zoneAssets = (iri) => {
  const part = byId.get(iri);
  return part?.type === "IACSZone" ? (part.composedOf ?? []).flatMap(zoneAssets) : [iri];
};
for (const s of systems)
  for (const part of (s.composedOf ?? []).flatMap(zoneAssets)) addEdge(short(part), short(s.id), "composes");
for (const f of functions) for (const s of f.implementedBy ?? []) addEdge(short(s), short(f.id), "implements");
for (const o of outcomes) for (const f of o.requiresFunction ?? []) addEdge(short(f), short(o.id), "requires");
for (const r of rels) {
  if (r.relationshipType === "DEPENDS_ON") addEdge(short(r.targetRef), short(r.sourceRef), "depends", null);
  if (r.relationshipType === "PROPAGATES_TO") addEdge(short(r.sourceRef), short(r.targetRef), "propagates", null);
}
for (const d of dependencies) {
  const [from, to] = d.name.split(" depends on ").map((s) => s.trim()).reverse();
  const k = `${from}>${to}`;
  const e = edges.find((x) => `${x.from}>${x.to}` === k);
  if (e) {
    e.kind = "depends";
    e.label = d.dependencyType;
    e.dependency = short(d.id);
  } else addEdge(from, to, "depends", d.dependencyType);
}

const controlsFromIris = (iris) =>
  (iris ?? []).filter((x) => String(x).includes("/control/")).map(short);

const assessmentByControl = new Map();
for (const a of assessments) for (const c of controlsFromIris(a.governedBy)) assessmentByControl.set(c, a);

const controlSummary = (id) => {
  const c = controlById.get(id);
  const a = assessmentByControl.get(id);
  return {
    id,
    title: c?.title ?? id,
    domain: c?.domainId ?? id.split("-")[1],
    gates: gateMappings.filter((m) => m.controlId === id).map((m) => ({ gate: m.gateId, role: m.role })),
    result: a?.result ?? "NOT_ASSESSED",
    claimType: a?.claimType ?? null,
    sufficiency: a?.evidenceSufficiency ?? null,
    rationale: a?.resultRationale ?? null,
    assessment: a ? short(a.id) : null,
    findings: findings.filter((f) => f.criterionRef === id).map((f) => short(f.id)),
    unknowns: shorts(a?.hasUnknown),
  };
};

const referencedControls = new Set();
for (const s of safeguards) controlsFromIris(s.governedBy).forEach((c) => referencedControls.add(c));
for (const a of assessments) controlsFromIris(a.governedBy).forEach((c) => referencedControls.add(c));
for (const g of gateResults)
  for (const e of g.controlEvaluations ?? []) referencedControls.add(short(e.controlRef));

const caseData = {
  source: ds,
  capability: {
    id: short(capability.id),
    name: capability.name,
    boundary: capability.boundary,
    demandProfile: capability.demandProfile,
    operatingEnvelope: capability.operatingEnvelope,
    workload: capability.workload,
    criticality: capability.criticality,
  },
  outcomes: outcomes.map((o) => ({
    id: short(o.id),
    name: o.name,
    measure: o.measure,
    tolerance: o.tolerance,
    states: o.operatingStates,
  })),
  nodes,
  edges,
  faultDomains: faultDomains.map((f) => ({
    id: short(f.id),
    commonMode: f.commonMode,
    blastRadius: f.blastRadius,
    boundary: f.boundary,
    members: shorts(f.faultDomainMembers).filter((m) => nodeIds.has(m)),
  })),
  dependencies: dependencies.map((d) => ({
    id: short(d.id),
    name: d.name,
    type: d.dependencyType,
    external: Boolean(d.external),
    faultDomain: short(d.faultDomainRef) ?? null,
  })),
  initiators: initiators.map((i) => ({
    id: short(i.id),
    type: i.type,
    name: i.name.replace(/^Synthetic (\w)/, (_, c) => c.toUpperCase()),
    mechanism: i.failureMechanism ?? i.hazardType ?? i.threatSource ?? null,
    scenarios: shorts(i.initiates),
    exposed: all.filter((x) => (x.exposedTo ?? []).includes(i.id)).map((x) => short(x.id)),
  })),
  scenarios: scenarios.map((s) => {
    const steps = (s.propagationSteps ?? []).map((r) => {
      const rel = relById.get(r);
      if (!rel) fail(`scenario ${s.id} references missing relationship ${r}`);
      return { from: short(rel.sourceRef), to: short(rel.targetRef) };
    });
    return {
      id: short(s.id),
      name: s.name.replace(/^Synthetic (\w)/, (_, c) => c.toUpperCase()),
      preState: s.preState,
      residualState: s.residualState,
      confidence: s.confidence,
      initiatedBy: initiators.filter((i) => (i.initiates ?? []).includes(s.id)).map((i) => short(i.id)),
      steps,
      safeguards: shorts(s.expectedSafeguards),
      effects: (s.outcomeEffects ?? []).map((e) => ({
        outcome: short(e.outcomeRef),
        effect: e.effect,
        exceedsTolerance: Boolean(e.exceedsTolerance),
      })),
      restricted: Boolean(s.distributionControlRef),
    };
  }),
  safeguards: safeguards.map((s) => ({
    id: short(s.id),
    name: s.name.replace(/^Synthetic (\w)/, (_, c) => c.toUpperCase()),
    activation: s.activation,
    trigger: s.activationTrigger,
    implementedBy: shorts(s.implementedBy),
    dependsOn: shorts(s.dependsOn),
    controls: controlsFromIris(s.governedBy),
  })),
  controls: Object.fromEntries([...referencedControls].sort().map((id) => [id, controlSummary(id)])),
  findings: findings.map((f) => ({
    id: short(f.id),
    control: f.criterionRef,
    class: f.findingClass,
    status: f.findingStatus,
    condition: f.condition,
    consequence: f.consequence,
    gateEffect: f.gateEffect,
  })),
  unknowns: unknowns.map((u) => ({
    id: short(u.id),
    name: u.name.replace(/^U-\d+ /, ""),
    severity: u.unknownSeverity,
    material: Boolean(u.material),
    subject: short(u.subjectRef ?? (u.qualifies ?? [])[0]),
    reason: u.reason,
    evidenceNeeded: u.evidenceNeeded,
    decisionEffect: u.decisionEffect,
    constrains: shorts(u.constrains).filter((x) => x.startsWith("GR-")).map((x) => x.replace(/^GR-/, "")),
    status: u.unknownStatus,
  })),
  gateResults: gateResults
    .map((g) => ({
      gate: g.gateCode,
      state: g.gateState,
      applicability: g.gateApplicability,
      sufficiency: g.evidenceSufficiency ?? null,
      rationale: g.rollupRationale,
      decisionEffect: g.decisionEffect,
      findings: shorts(g.hasFinding),
      evaluations: (g.controlEvaluations ?? []).map((e) => ({
        control: short(e.controlRef),
        role: e.gateRole,
        result: e.controlResult,
      })),
      criteria: (g.criteriaResults ?? []).map((c) => ({ id: c.criterionId, outcome: c.criterionOutcome })),
    }))
    .sort((a, b) => a.gate.localeCompare(b.gate)),
  decision: {
    question: decision.decisionQuestion,
    scope: decision.decisionScope,
    state: decision.decisionState,
    recommended: recommendation.recommendedState,
    controllingReasons: decision.controllingReasons,
    otherCeilings: (recommendation.limitations ?? []).find((l) => l.startsWith("Ceilings")) ?? null,
    limitations: decision.limitations,
    validUntil: decision.effectiveTo?.slice(0, 10) ?? null,
    notCertification: Boolean(decision.notCertification),
    approvalNote: "Synthetic record; no human approval was given.",
  },
  score: {
    band: score.band,
    bandWithheldReason: score.bandWithheldReason,
    coverage: score.coverage,
    meanScore: score.meanScore ?? null,
    method: score.calculationMethod,
    hash: score.calculationHash,
  },
};

// Guard the headline numbers the homepage quotes.
assertEq("synthetic decision", caseData.decision.state, "NOT_ASSURED");
assertEq("scored controls", caseData.score.coverage.scoredCount, 11);
const gateCount = (st) => caseData.gateResults.filter((g) => g.state === st).length;
caseData.summary = {
  fail: caseData.gateResults.filter((g) => g.state === "FAIL").map((g) => g.gate),
  unknown: caseData.gateResults.filter((g) => g.state === "UNKNOWN").map((g) => g.gate),
  notAssessed: gateCount("NOT_ASSESSED"),
  pass: gateCount("PASS"),
  assessed: caseData.score.coverage.assessedCount,
  scored: caseData.score.coverage.scoredCount,
  coveragePercent: caseData.score.coverage.coveragePercent,
  unknownRecords: caseData.unknowns.length,
  findings: caseData.findings.length,
};

// ---------------------------------------------------------- validation

const register = csv("research/back-testing/incident-register.csv");
const by = (rows, key) =>
  rows.reduce((acc, r) => {
    const k = r[key] || "(blank)";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
const eligible = register.filter((r) => r.eligibility_status === "ELIGIBLE");
const excluded = register.filter((r) => r.eligibility_status === "EXCLUDED");
const panelControls = csv("validation/expert-panel/control-sample.csv");
const panelGates = csv("validation/expert-panel/gate-sample.csv");
const starter = csv("pilots/pilot-framework/starter-profile.csv");
const evidenceRequests = csv("pilots/pilot-authorisation/evidence-request-list.csv");
const dispositions = listDir("validation/reviewer-dispositions").filter((f) => f !== "README.md");
const reviews = listDir("validation/independent-review").filter((f) => f !== "README.md");

const validation = {
  backTest: {
    protocol: "research/back-testing/AIDCF-VAL-001_Incident_Back-Testing_Protocol_v1.0.md",
    logged: register.length,
    eligible: eligible.length,
    excluded: excluded.length,
    eligibleByStratum: by(eligible, "failure_category"),
    excludedByCode: by(excluded, "exclusion_code"),
    selected: register.filter((r) => /SELECTED/.test(r.eligibility_status)).length,
    coded: register.filter((r) => r.coding_status && r.coding_status !== "NOT_STARTED").length,
  },
  expertPanel: {
    protocol: "validation/expert-panel/AIDCF-VAL-002_Expert_Panel_Content_Validation_Protocol_v1.0.md",
    controls: panelControls.length,
    gates: panelGates.length,
  },
  pilot: {
    protocol: "pilots/pilot-framework/AIDCF-PIL-001_Mini-Pilot_Protocol_v1.0.md",
    starterControls: starter.length,
    evidenceRequests: evidenceRequests.length,
  },
  independentReview: { reviews: reviews.length, dispositions: dispositions.length },
};

// ------------------------------------------------------------ research

const artifacts = csv("registries/catalogue/artifacts.csv").map((a) => ({
  id: a.publicId || a.code,
  title: a.title,
  summary: a.definition,
  path: a.path,
  version: a.artifactVersion,
  status: a.artifactStatus,
}));
const whitepaperMd = "whitepaper/current/AIDCF_Technical_Whitepaper_v3.1_Validation_Candidate.md";
const whitepaperPdf = "whitepaper/current/AIDCF_Technical_Whitepaper_v3.1_Validation_Candidate.pdf";
track(whitepaperMd);
track(whitepaperPdf);
const cff = track("CITATION.cff");
const cffField = (k) => cff.match(new RegExp(`^${k}:\\s*"?([^"\\n]+)"?`, "m"))?.[1] ?? null;
const readme = track("README.md");
const statusLine = (label) => readme.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+?)\\s*$`, "m"))?.[1] ?? null;

const research = {
  name: readme.match(/^## (.+)$/m)?.[1] ?? null,
  repositoryStatus: statusLine("Repository status"),
  frameworkVersion: statusLine("Public framework version"),
  baseline: statusLine("Canonical control baseline"),
  implementation: statusLine("Current implementation"),
  externalValidation: statusLine("External validation"),
  whitepaper: { md: whitepaperMd, pdf: whitepaperPdf, pdfSha256: sources.get(whitepaperPdf) },
  citation: {
    title: cffField("title"),
    version: cffField("version"),
    released: cffField("date-released"),
    doi: cffField("doi"),
    reportTitle: cff.match(/preferred-citation:[\s\S]*?title:\s*"([^"]+)"/)?.[1] ?? null,
    authors: [...cff.matchAll(/family-names:\s*(.+)\n\s*given-names:\s*(.+)/g)]
      .slice(0, 1)
      .map((m) => ({ family: m[1].trim(), given: m[2].trim() })),
  },
  artifacts,
};
if (!research.name) fail("framework name not found in README");

const conformance = JSON.parse(track("implementation/aidcf-015-v1.3/outputs/validation-results.json"));
research.conformance = {
  release: conformance.release,
  executedAt: conformance.executedAt,
  independent: Boolean(conformance.independent),
  note: conformance.note,
  layers: Object.entries(conformance.layers).map(([layer, r]) => ({ layer, checks: r.checks, failed: r.failed, outcome: r.outcome })),
};
research.conformance.checks = research.conformance.layers.reduce((n, l) => n + l.checks, 0);
research.conformance.allPass = research.conformance.layers.every((l) => l.outcome === "PASS");

// ------------------------------------------------------------ manifest

const manifest = {
  release: pin.release,
  repository: pin.repository,
  commit: pin.commit,
  sources: Object.fromEntries([...sources.entries()].sort()),
};

// ---------------------------------------------------------------- write

const outputs = {
  "manifest.json": manifest,
  "framework.json": framework,
  "case.json": caseData,
  "validation.json": validation,
  "research.json": research,
};

let stale = 0;
mkdirSync(outDir, { recursive: true });
for (const [name, data] of Object.entries(outputs)) {
  const text = `${JSON.stringify(data, null, 2)}\n`;
  const path = join(outDir, name);
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (checkOnly) {
    if (current !== text) {
      console.error(`stale: src/data/${name}`);
      stale++;
    }
  } else if (current !== text) {
    writeFileSync(path, text);
    console.log(`wrote src/data/${name}`);
  }
}
if (checkOnly && stale) fail(`${stale} data file(s) are stale; run npm run content`);
console.log(`content ${checkOnly ? "check passed" : "up to date"}: ${pin.release} @ ${pin.commit.slice(0, 7)}, ${sources.size} source files hashed`);
