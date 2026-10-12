#!/usr/bin/env node
// Hardens the static export after `next build`:
//  - adds a per-page Content-Security-Policy <meta> listing a SHA-256 hash for
//    each inline script on that page, so no other inline script can run;
//  - writes out/_headers for Cloudflare Pages with the security headers that
//    cannot be set from a <meta> tag, and long-lived caching for hashed assets.

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const out = new URL("../out/", import.meta.url).pathname;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

const inline = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
let pages = 0;
for (const file of walk(out)) {
  if (!file.endsWith(".html")) continue;
  let html = readFileSync(file, "utf8");
  if (html.includes('http-equiv="Content-Security-Policy"')) continue;
  const hashes = new Set();
  for (const m of html.matchAll(inline)) {
    hashes.add(`'sha256-${createHash("sha256").update(m[1], "utf8").digest("base64")}'`);
  }
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${[...hashes].join(" ")}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}"/>`;
  html = html.replace(/<head>/, `<head>${meta}`);
  if (!html.includes(meta)) throw new Error(`no <head> in ${relative(out, file)}`);
  writeFileSync(file, html);
  pages++;
}

const headers = `/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
`;
writeFileSync(join(out, "_headers"), headers);
console.log(`postbuild: CSP added to ${pages} page(s); _headers written`);
