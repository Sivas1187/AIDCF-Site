import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://aidcf.org";
  return ["/", "/case/", "/privacy/", "/accessibility/"].map((p) => ({ url: `${base}${p}` }));
}
