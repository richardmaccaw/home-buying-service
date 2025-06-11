import { NextRequest, NextResponse } from "next/server";
import { AreaAverageService } from "@/lib/services/area-average.service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const postcode = body.postcode as string | undefined;
    if (!postcode) {
      return NextResponse.json({ error: "Postcode is required" }, { status: 400 });
    }

    const res = await fetch(`https://housemetric.co.uk/results?str_input=${encodeURIComponent(postcode)}`);
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch postcode data (${res.status})` }, { status: res.status });
    }
    const html = await res.text();
    const service = new AreaAverageService(process.env.GOOGLE_API_KEY!);
    const areaAverage = await service.extractAverage(html, postcode);
    return NextResponse.json({ areaAverage });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
