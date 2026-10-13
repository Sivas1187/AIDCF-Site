import domainsJson from "@/data/domains.json";

// Family and control index for the domain explorer. Kept out of data.ts so that pages which do not show it
// do not carry it.
export interface ControlIndexEntry {
  id: string;
  title: string;
  critical: string[];
  supporting: string[];
}
export interface FamilyIndexEntry {
  id: string;
  name: string;
  controls: ControlIndexEntry[];
}
export const domainIndex = domainsJson as Record<string, FamilyIndexEntry[]>;
