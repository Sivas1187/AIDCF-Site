import controlsJson from "@/data/controls.json";

// Full control text from registry v1.1. Read only by statically rendered pages, never by client components.
export interface ControlDetail {
  objective: string;
  requirement: string;
  claimType: string;
  assuranceLevel: string;
  controlType: string;
  tier: string;
  sufficiencyFloor: string;
  requiredClasses: string[];
  optionalClasses: string[];
  stateCoverage: string[];
  unknownEffect: string | null;
}
export const controlDetail = controlsJson as {
  registryStatus: string;
  registryVersion: string;
  vocab: { evidenceClasses: Record<string, string>; claimTypes: Record<string, string>; sufficiency: Record<string, string> };
  controls: Record<string, ControlDetail>;
};
