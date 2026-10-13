import type { MetadataRoute } from "next";
import { framework } from "@/lib/data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://aidcf.org";
  const domains = framework.domains.map((d) => `/domains/${d.id.toLowerCase()}/`);
  return ["/", "/method/", "/domains/", ...domains, "/case/", "/scenarios/", "/resources/", "/privacy/", "/accessibility/"].map((p) => ({ url: `${base}${p}` }));
}
