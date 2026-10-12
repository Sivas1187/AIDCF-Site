import type { Metadata } from "next";
import { repoUrl } from "@/lib/data";

export const metadata: Metadata = {
  title: "Accessibility statement",
  description: "Accessibility of the AIDCF website: target standard, known limitations and how to report a problem.",
};

export default function Accessibility() {
  return (
    <section className="block">
      <div className="wrap prose">
        <h1>Accessibility statement</h1>
        <p>
          This site aims to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. It has been checked
          by its author with automated tools and keyboard testing. It has not yet had an independent accessibility
          audit.
        </p>
        <h2>What has been done</h2>
        <ul>
          <li>All content and controls work with a keyboard, with a visible focus indicator and a skip link.</li>
          <li>
            The interactive dependency graph has a list view with the same content as text, and it opens in list view
            on small screens.
          </li>
          <li>States such as FAIL, UNKNOWN and PASS are shown with a symbol and a text label as well as colour.</li>
          <li>The site follows your light or dark preference, works at 320 pixels wide, and respects reduced motion.</li>
          <li>Tables have headers and stack into labelled rows on narrow screens.</li>
        </ul>
        <h2>Known limitations</h2>
        <ul>
          <li>The graph view is visual by nature. Screen-reader users should use the list view.</li>
          <li>Some linked documents on GitHub are long technical texts and PDFs, which may be harder to navigate.</li>
        </ul>
        <h2>Report a problem</h2>
        <p>
          Open an issue in the <a href={`${repoUrl}/issues`}>GitHub issue tracker</a> describing the page and the
          problem.
        </p>
      </div>
    </section>
  );
}
