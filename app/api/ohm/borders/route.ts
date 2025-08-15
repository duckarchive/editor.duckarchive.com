import { NextResponse } from "next/server";

// Simple in-memory cache
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

function getCacheKey(date: string, bbox: string): string {
  return `${date}-${bbox}`;
}

function isExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_TTL;
}

function getCachedData(key: string): any | null {
  const entry = cache.get(key);

  if (!entry) return null;

  if (isExpired(entry.timestamp)) {
    cache.delete(key);

    return null;
  }

  return entry.data;
}

function setCachedData(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const bbox = searchParams.get("bbox"); // lat1,lon1,lat2,lon2

  if (!date || !bbox) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // Check cache first
  const cacheKey = getCacheKey(date, bbox);
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return NextResponse.json(cachedData);
  }

  const q = `
[out:json][timeout:60];
(
  relation(${bbox})["admin_level"="2"]
    (if: t["start_date"] <= "${date}" && (!is_tag("end_date") || t["end_date"] > "${date}"));
  way(r);
  node(w);
);
out geom;
`.trim();

  const res = await fetch(
    "https://overpass-api.openhistoricalmap.org/api/interpreter",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: new URLSearchParams({ data: q }).toString(),
    },
  );

  if (!res.ok)
    return NextResponse.json({ error: "Overpass error" }, { status: 500 });

  const json = await res.json();

  // Cache the response
  setCachedData(cacheKey, json);

  return NextResponse.json(json);
}
