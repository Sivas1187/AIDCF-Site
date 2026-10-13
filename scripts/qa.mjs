// Local QA: screenshots, axe accessibility scan, console errors, horizontal
// overflow, and a scripted pass through the case explorer.
// Usage: node scripts/qa.mjs <baseUrl> <outDir>
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright");
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const [base, out] = process.argv.slice(2);
const pages = ["/", "/method/", "/domains/", "/domains/pow/", "/case/", "/scenarios/", "/resources/", "/privacy/", "/accessibility/"];
const viewports = { desktop: { width: 1366, height: 900 }, tablet: { width: 1024, height: 768 }, mobile: { width: 375, height: 812 } };
const browser = await chromium.launch();
let problems = 0;

for (const scheme of ["light", "dark"]) {
  for (const [vpName, vp] of Object.entries(viewports)) {
    // bypassCSP lets axe be injected; the CSP itself is exercised in a separate pass below.
    const ctx = await browser.newContext({ viewport: vp, colorScheme: scheme, bypassCSP: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    for (const p of pages) {
      await page.goto(base + p, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 0) {
        console.log(`OVERFLOW ${scheme} ${vpName} ${p}: ${overflow}px`);
        problems++;
      }
      await page.addScriptTag({ content: axeSource });
      const res = await page.evaluate(async () => {
        // @ts-ignore
        const r = await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] });
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target?.join(" "), msg: v.nodes[0]?.failureSummary?.slice(0, 200) }));
      });
      for (const v of res) {
        console.log(`AXE ${scheme} ${vpName} ${p}: ${v.id} (${v.impact}) x${v.n} ${v.sample} :: ${v.msg}`);
        problems++;
      }
      const name = `${scheme}-${vpName}${p === "/" ? "-home" : p.replace(/\//g, "-").replace(/-$/, "")}`;
      if (scheme === "light" || p === "/case/") await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
    }
    // The failure story: four stages on the homepage and the case page.
    for (const [p, sel] of [["/", ".story-hero"], ["/case/", ".story-board"]]) {
      await page.goto(base + p, { waitUntil: "networkidle" });
      const n = await page.locator(`${sel} .story-stage`).count();
      const t = await page.locator(sel).innerText();
      if (n !== 4 || !/Not assured/i.test(t) || !/Inference latency/.test(t)) {
        console.log(`STORY ${scheme} ${vpName} ${p}: ${n} stages, or decision or outcome missing`);
        problems++;
      }
    }
    if (vpName === "mobile") {
      await page.goto(base + "/domains/", { waitUntil: "networkidle" });
      const folded = await page.locator(".dx-cluster.folded").count();
      await page.locator(".dx-cluster.folded .dx-fold").first().click();
      const after = await page.locator(".dx-cluster.folded").count();
      if (folded !== 6 || after !== 5) {
        console.log(`DOMAINS ${scheme} mobile: ${folded} folded clusters, ${after} after opening one`);
        problems++;
      }
      await page.screenshot({ path: `${out}/${scheme}-mobile-domains-folded.png`, fullPage: true });
    }
    // Scripted interaction on the case page.
    await page.goto(base + "/case/", { waitUntil: "networkidle" });
    if (vpName === "desktop") {
      await page.selectOption("#scenario", "FS-02");
      await page.waitForTimeout(200);
      const panel = await page.locator(".panel").innerText();
      if (!/cannot be relied on here/.test(panel)) {
        console.log(`CASE ${scheme}: FS-02 panel lacks the compromised-safeguard warning`);
        problems++;
      }
      await page.screenshot({ path: `${out}/${scheme}-desktop-case-FS02.png`, fullPage: false, clip: { x: 0, y: 0, width: 1366, height: 900 } });
      const sec = await page.locator("text=Dependencies and failure paths").boundingBox();
      if (sec) {
        await page.evaluate((y) => window.scrollTo(0, y - 70), sec.y + (await page.evaluate(() => window.scrollY)));
        await page.waitForTimeout(150);
        await page.screenshot({ path: `${out}/${scheme}-desktop-case-FS02-graph.png` });
      }
      await page.selectOption("#scenario", "");
      await page.locator('[aria-label^="BMS controller"]').first().focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(150);
      const np = await page.locator(".panel").innerText();
      if (!/Shared fault domain FD-02/.test(np)) {
        console.log(`CASE ${scheme}: BMS node panel lacks FD-02`);
        problems++;
      }
      await page.screenshot({ path: `${out}/${scheme}-desktop-case-node.png` });
      // Guided journey: walks the default scenario to the decision.
      await page.getByRole("button", { name: "Guided journey" }).click();
      await page.waitForTimeout(150);
      let jp = await page.locator(".panel").innerText();
      if (!/step 1 of \d+/.test(jp) || !/The failure starts here/.test(jp)) {
        console.log(`CASE ${scheme}: journey did not start at the origin`);
        problems++;
      }
      await page.getByRole("button", { name: "Next →" }).click();
      await page.getByRole("button", { name: "Next →" }).click();
      await page.waitForTimeout(150);
      await page.screenshot({ path: `${out}/${scheme}-desktop-case-journey.png` });
      for (let i = 0; i < 20 && (await page.getByRole("button", { name: "Next →" }).count()); i++) {
        await page.getByRole("button", { name: "Next →" }).click();
        const t = await page.locator(".panel").innerText();
        if (/What the evidence showed/.test(t)) {
          if (!/Evidence (gap|detail|: \d+ object)/.test(t) && !/Not assessed: no evidence/.test(t)) {
            console.log(`CASE ${scheme}: journey controls step lacks evidence`);
            problems++;
          }
          await page.screenshot({ path: `${out}/${scheme}-desktop-case-journey-evidence.png` });
        }
      }
      jp = await page.locator(".panel").innerText();
      if (!/Traced back: CG-\d+/i.test(jp)) {
        console.log(`CASE ${scheme}: decision step has no trace to the controlling gate`);
        problems++;
      }
      await page.screenshot({ path: `${out}/${scheme}-desktop-case-journey-decision.png` });
      if (!jp.includes(await page.evaluate(() => document.querySelector(".decision-card .big")?.textContent ?? "?"))) {
        console.log(`CASE ${scheme}: journey does not end on the decision`);
        problems++;
      }
      // Domain explorer: choose a domain, then a gate.
      await page.goto(base + "/domains/", { waitUntil: "networkidle" });
      await page.locator(".dx-domain", { hasText: "THM" }).click();
      if (!/Cooling, Thermal and Fluid/.test(await page.locator(".panel").innerText())) {
        console.log(`DOMAINS ${scheme}: THM not shown after selection`);
        problems++;
      }
      await page.selectOption("#gate-filter", "CG-07");
      await page.waitForTimeout(150);
      if (!/domains hold CRITICAL controls/.test(await page.locator(".panel").innerText())) {
        console.log(`DOMAINS ${scheme}: gate view missing`);
        problems++;
      }
      await page.screenshot({ path: `${out}/${scheme}-desktop-domains-gate.png` });
      // Scenario library: 20 cards; filters narrow them.
      await page.goto(base + "/scenarios/", { waitUntil: "networkidle" });
      const all = await page.locator(".sc-card:visible").count();
      await page.selectOption("#sc-domain", "NET");
      await page.selectOption("#sc-gate", "CG-08");
      await page.waitForTimeout(150);
      const net = await page.locator(".sc-card:visible").count();
      await page.fill("#sc-q", "zzzz-no-match");
      await page.waitForTimeout(150);
      const none = await page.locator(".sc-card:visible").count();
      if (all !== 20 || !(net > 0 && net < 20) || none !== 0) {
        console.log(`SCENARIOS ${scheme}: ${all} cards, ${net} for NET and CG-08, ${none} for a non-match`);
        problems++;
      }
      await page.goto(base + "/domains/pow/", { waitUntil: "networkidle" });
      await page.fill("#control-filter", "UPS");
      await page.waitForTimeout(150);
      const visible = await page.locator(".dx-control:visible").count();
      if (!(visible > 0 && visible < 24)) {
        console.log(`DOMAINS ${scheme}: filter shows ${visible} controls for "UPS"`);
        problems++;
      }
    } else if (vpName === "mobile") {
      // Phones get the graph too: it scrolls sideways inside its frame, not the page.
      const frame = await page.locator(".graph-frame").evaluate((el) => el.scrollWidth > el.clientWidth).catch(() => false);
      if (!frame) {
        console.log(`CASE ${scheme} mobile: graph view not default, or it does not scroll inside its frame`);
        problems++;
      }
      await page.selectOption("#scenario", "FS-04");
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${out}/${scheme}-mobile-case-FS04.png`, fullPage: true });
      await page.getByRole("button", { name: "Guided journey" }).click();
      await page.getByRole("button", { name: "Next →" }).click();
      await page.waitForTimeout(400);
      if (!(await page.locator(".journey-path").isVisible())) {
        console.log(`CASE ${scheme} mobile: compact failure path not shown`);
        problems++;
      }
      await page.screenshot({ path: `${out}/${scheme}-mobile-case-journey.png` });
    }
    for (const e of errors) {
      console.log(`CONSOLE ${scheme} ${vpName}: ${e}`);
      problems++;
    }
    await ctx.close();
  }
}
// CSP-enforced pass: the site's own scripts must run under its policy.
{
  const ctx = await browser.newContext({ viewport: viewports.desktop });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  for (const p of pages) await page.goto(base + p, { waitUntil: "networkidle" });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.locator('a.btn.primary[href="/case/#journey"]').first().click();
  await page.waitForURL("**/case/#journey");
  await page.waitForTimeout(300);
  if (!(await page.locator(".journey-bar").count())) {
    console.log("CSP pass: the homepage story link did not open the guided journey");
    problems++;
  }
  await page.selectOption("#scenario", "FS-05");
  await page.locator(".gate-cell").nth(6).click();
  await page.locator('.nav a[href="/method/"]').click();
  await page.waitForURL("**/method/");
  await page.locator('main a[href="/domains/"]').first().click();
  await page.waitForURL("**/domains/");
  await page.locator(".dx-domain", { hasText: "NET" }).click();
  if (!/AI Network and Interconnect/.test(await page.locator(".panel").innerText())) {
    console.log("CSP pass: domain explorer did not respond");
    problems++;
  }
  await page.locator('.nav a[href="/#validation"]').click();
  await page.waitForTimeout(400);
  const hydrated = await page.evaluate(() => location.pathname);
  if (hydrated !== "/") {
    console.log(`CSP pass: client navigation ended at ${hydrated}`);
    problems++;
  }
  for (const e of errors) {
    console.log(`CSP CONSOLE: ${e}`);
    problems++;
  }
  await ctx.close();
}
await browser.close();
console.log(problems ? `QA: ${problems} problem(s)` : "QA: no problems found");
process.exit(problems ? 1 : 0);
