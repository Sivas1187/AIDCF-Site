"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const links = [
  { href: "/#method", label: "Methodology" },
  { href: "/domains/", label: "15 domains" },
  { href: "/case/", label: "Infrastructure graph" },
  { href: "/scenarios/", label: "Scenarios" },
  { href: "/#validation", label: "Validation" },
  { href: "/#research", label: "Research" },
  { href: "/resources/", label: "Resources" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brand" aria-label="AIDCF home">
          <Logo />
          <span>AIDCF</span>
          <small>AI Data Centre Facilities Assurance Framework</small>
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <nav id="site-nav" className="nav" aria-label="Main" data-open={open}>
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={pathname === l.href || (!l.href.includes("#") && pathname.startsWith(l.href)) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
