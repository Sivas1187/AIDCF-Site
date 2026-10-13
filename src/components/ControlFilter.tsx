"use client";

import { useEffect, useState } from "react";

// Filters the control cards rendered on a domain page by text, without loading the control data into the browser.
export function ControlFilter({ total }: { total: number }) {
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(total);

  useEffect(() => {
    const needle = q.trim().toLowerCase();
    let n = 0;
    for (const el of document.querySelectorAll<HTMLElement>(".dx-control")) {
      const hit = !needle || (el.textContent ?? "").toLowerCase().includes(needle);
      el.hidden = !hit;
      if (hit) n++;
      // Open the requirement text of matching controls so the match is visible.
      const det = el.querySelector("details");
      if (det && needle) det.open = hit;
    }
    for (const sec of document.querySelectorAll<HTMLElement>(".dx-fam")) {
      sec.hidden = !sec.querySelector(".dx-control:not([hidden])");
    }
    setShown(n);
  }, [q]);

  return (
    <div className="toolbar dx-filter">
      <label htmlFor="control-filter">Find a control</label>
      <input
        id="control-filter"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="e.g. UPS, firmware, CG-05, EFFECTIVENESS"
        autoComplete="off"
      />
      <span className="small muted" role="status">
        {shown === total ? `${total} controls` : `${shown} of ${total} controls`}
      </span>
    </div>
  );
}
