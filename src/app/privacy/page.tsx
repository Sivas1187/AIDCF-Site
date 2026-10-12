import type { Metadata } from "next";
import { repoUrl } from "@/lib/data";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How the AIDCF website handles visitor data: no analytics, no cookies, no forms.",
};

export default function Privacy() {
  return (
    <section className="block">
      <div className="wrap prose">
        <h1>Privacy notice</h1>
        <p>This website is a set of static pages. It is built to collect as little as possible.</p>
        <h2>What the site does not do</h2>
        <ul>
          <li>It uses no analytics or tracking scripts.</li>
          <li>It sets no cookies and uses no browser storage.</li>
          <li>It has no forms, accounts or sign-in, and loads no third-party scripts, fonts or embeds.</li>
        </ul>
        <h2>What the hosting provider processes</h2>
        <p>
          The site is served by Cloudflare. Like any web host, Cloudflare processes technical data such as your IP
          address and browser details in order to deliver pages and protect the site from abuse. The site owner does
          not use that data to identify or profile visitors. Cloudflare&rsquo;s own handling is described in its{" "}
          <a href="https://www.cloudflare.com/privacypolicy/">privacy policy</a>.
        </p>
        <h2>Links to other sites</h2>
        <p>
          Many links go to GitHub, where the AIDCF documents live. GitHub&rsquo;s privacy terms apply there. If you
          open an issue or comment on GitHub, that content is public.
        </p>
        <h2>Questions</h2>
        <p>
          Raise a question through the <a href={`${repoUrl}/issues`}>GitHub issue tracker</a>.
        </p>
      </div>
    </section>
  );
}
