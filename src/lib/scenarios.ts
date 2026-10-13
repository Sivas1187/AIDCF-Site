import scenariosJson from "@/data/scenarios.json";

// The AIDCF-004 cross-domain scenario library. Imported only by the scenarios page.
export interface LibraryScenario {
  id: string;
  title: string;
  initiatingEvent: string;
  preconditions: string;
  operatingStates: string;
  states: string[];
  path: { domains: string[]; text: string }[];
  requiredFunctions: string;
  serviceOutcomes: string;
  safeguards: string[];
  families: string[];
  familyText: string;
  gates: string[];
  evidence: string[];
  unknowns: string;
  domains: string[];
}
export const scenarioLibrary = scenariosJson as { source: string; intro: string; scenarios: LibraryScenario[] };
