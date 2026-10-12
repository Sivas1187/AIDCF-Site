import Link from "next/link";
import { manifest, repoUrl, research, shortCommit } from "@/lib/data";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap cols">
        <div>
          <p>
            <strong>AIDCF</strong>, {research.name}. {research.repositoryStatus}. A methodology, not a
            certification scheme or product.
          </p>
          <p>
            Content generated from release <span className="mono">{manifest.release}</span> at commit{" "}
            <a className="mono" href={`${repoUrl}/tree/${manifest.commit}`}>
              {shortCommit}
            </a>
            . Text and data are licensed under{" "}
            <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; site code under{" "}
            <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache 2.0</a>.
          </p>
        </div>
        <ul aria-label="Project">
          <li>
            <a href={repoUrl}>GitHub repository (canonical source)</a>
          </li>
          <li>
            <a href={`${repoUrl}/blob/main/CHANGELOG.md`}>Changelog</a>
          </li>
          <li>
            <a href={`${repoUrl}/blob/main/CONTRIBUTING.md`}>Contributing</a>
          </li>
          <li>
            <a href={`${repoUrl}/blob/main/SECURITY.md`}>Security policy</a>
          </li>
        </ul>
        <ul aria-label="Site">
          <li>
            <Link href="/privacy/">Privacy notice</Link>
          </li>
          <li>
            <Link href="/accessibility/">Accessibility statement</Link>
          </li>
          <li>
            <a href="https://aitrustgraph.org">AI Trust Graph (companion project)</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
