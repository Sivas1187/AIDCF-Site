import type { LibraryScenario } from "@/lib/scenarios";

// Reads the structure AIDCF-004 already writes into each library scenario: the
// relationship words in a path step, the step numbers a safeguard cites, and
// the domain crossings marked "A → B" in a step. Nothing is inferred beyond that.

const RELATIONS = [
  "PROPAGATES_TO",
  "PROPAGATES_VIA",
  "CONTRIBUTES_TO",
  "CORRELATE_WITH",
  "REINTRODUCES",
  "AMPLIFIES",
  "ESCALATES",
  "BYPASSES",
  "TRIGGERS",
  "TRIGGER",
  "DELAYS",
  "MASKS",
  "CAUSES",
];

/** The relationship words in a step, in the order they appear. */
export function stepRelations(text: string): string[] {
  const found = [...text.matchAll(/\b([A-Z][A-Z_]{3,})\b/g)].map((m) => m[1]).filter((w) => RELATIONS.includes(w));
  return [...new Set(found)];
}

export type SafeguardRef = { verb: string; steps: number[] };
export type ParsedSafeguard = { kind: string; text: string; refs: SafeguardRef[] };

/** "Escalation: ... (interrupts step 4); ... (limits steps 2–3)" → kind and step references. */
export function parseSafeguard(text: string): ParsedSafeguard {
  const kind = /^([A-Z][a-z]+(?: side)?):/.exec(text)?.[1] ?? "";
  const refs: SafeguardRef[] = [];
  for (const m of text.matchAll(/\((interrupts|limits|contains|delays)\s+steps?\s+(\d+)(?:\s*[–-]\s*(\d+))?\)/gi)) {
    const a = Number(m[2]);
    const b = m[3] ? Number(m[3]) : a;
    refs.push({ verb: m[1].toLowerCase(), steps: Array.from({ length: b - a + 1 }, (_, i) => a + i) });
  }
  return { kind, text: text.replace(/^[A-Z][a-z]+(?: side)?:\s*/, ""), refs };
}

export type Crossing = { from: string; to: string; scenarios: string[] };

/** Domain crossings stated in path steps ("A → B"), counted once per scenario. */
export function crossings(lib: LibraryScenario[]): Crossing[] {
  const map = new Map<string, Set<string>>();
  for (const s of lib)
    for (const p of s.path)
      for (let k = 1; k < p.stages.length; k++)
        for (const from of p.stages[k - 1])
          for (const to of p.stages[k]) {
            if (from === to) continue;
            const key = `${from}>${to}`;
            if (!map.has(key)) map.set(key, new Set());
            map.get(key)!.add(s.id);
          }
  return [...map.entries()]
    .map(([k, v]) => {
      const [from, to] = k.split(">");
      return { from, to, scenarios: [...v].sort() };
    })
    .sort((a, b) => b.scenarios.length - a.scenarios.length || a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
}
