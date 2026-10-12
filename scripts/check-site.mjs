#!/usr/bin/env node
// Static checks on the built site in out/:
//  - every page has a language, a title, a description and a CSP;
//  - every internal link and #anchor resolves;
//  - no script is loaded from another origin;
//  - every link into the AIDCF repository at the pinned commit names a file
//    that exists in the pinned checkout (when $AIDCF_SRC is available);
//  - headline figures on the homepage match the generated data.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const out = join(root, "out");
const manifest = JSON.parse(readFileSync(join(root, "src/data/manifest.json"), "utf8"));
const caseData = JSON.parse(readFileSync(join(root, "src/data/case.json"), "utf8"));
const framework = JSON.parse(readFileSync(join(root, "src/data/framework.json"), "utf8"));
const src = process.env.AIDCF_SRC ?? join(root, "..", "aidcf");
let failures = 0;
const fail = (msg) => {
  console.error(`check-site: ${msg}`);
  failures++;
};

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
const pages = new Map();
for (const f of walk(out)) {
  if (!f.endsWith(".html")) continue;
  const rel = "/" + relative(out, f).replace(/index\.html$/, "").replace(/\.html$/, "");
  pages.set(rel, readFileSync(f, "utf8"));
}

const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const resolvePage = (path) => {
  const p = path.endsWith("/") ? path : `${path}/`;
  return pages.get(p) ?? pages.get(path) ?? (existsSync(join(out, path)) ? "" : null);
};

const repoPrefix = `${manifest.repository}/`;
const pinned = new Set();

for (const [path, html] of pages) {
  if (path === "/404" || path === "/_not-found/") continue;
  if (!/<html lang="en-GB"/.test(html)) fail(`${path}: missing lang`);
  if (!/<title>[^<]+<\/title>/.test(html)) fail(`${path}: missing title`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) fail(`${path}: missing description`);
  if (!/http-equiv="Content-Security-Policy"/.test(html)) fail(`${path}: missing CSP`);
  for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) {
    if (/^https?:/.test(m[1])) fail(`${path}: external script ${m[1]}`);
  }
  for (const m of html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    const href = decode(m[1]);
    if (href.startsWith("#")) {
      if (!ids(html).has(href.slice(1))) fail(`${path}: broken anchor ${href}`);
    } else if (href.startsWith("/")) {
      const [p, hash] = href.split("#");
      const target = resolvePage(p);
      if (target === null) fail(`${path}: broken link ${href}`);
      else if (hash && target && !ids(target).has(hash)) fail(`${path}: broken anchor ${href}`);
    } else if (href.startsWith(repoPrefix)) {
      const m2 = href.slice(repoPrefix.length).match(/^(blob|tree)\/([^/]+)\/(.+)$/);
      if (m2 && m2[2] === manifest.commit) pinned.add(m2[3]);
    } else if (!/^(https:|mailto:)/.test(href)) {
      fail(`${path}: unexpected link ${href}`);
    }
  }
}

if (existsSync(src)) {
  for (const p of pinned) if (!existsSync(join(src, decodeURIComponent(p)))) fail(`pinned link to missing file ${p}`);
} else {
  console.warn(`check-site: ${src} not found; skipped ${pinned.size} pinned-file checks`);
}

const home = pages.get("/") ?? "";
const expect = [
  [`>${framework.counts.controls}<`, "control count"],
  [`>${framework.counts.domains}<`, "domain count"],
  [caseData.decision.state, "synthetic decision"],
  [manifest.release, "release id"],
];
for (const [needle, label] of expect) if (!home.includes(needle)) fail(`homepage lacks ${label} (${needle})`);

if (!existsSync(join(out, "_headers"))) fail("out/_headers missing");

console.log(
  failures
    ? `check-site: ${failures} problem(s)`
    : `check-site: ${pages.size} pages OK; ${pinned.size} pinned repository links verified`,
);
process.exit(failures ? 1 : 0);
