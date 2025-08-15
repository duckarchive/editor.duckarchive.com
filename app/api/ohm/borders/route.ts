import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const bbox = searchParams.get("bbox"); // lat1,lon1,lat2,lon2

  if (!date || !bbox) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
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

  return NextResponse.json(json);
}
