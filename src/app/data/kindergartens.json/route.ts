import { listKindergartens } from "@/data/repository";

// Published next to the site as /data/kindergartens.json so the iPhone app can refresh its listings
// without a rebuild. Generated at build time (static export).
export const dynamic = "force-static";

export function GET() {
  const listings = listKindergartens();
  return Response.json({ version: 1, generatedAt: new Date().toISOString(), count: listings.length, listings });
}
