import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = process.env.SYNC_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing SYNC_SECRET on server." }, { status: 500 });
  }

  const origin = req.nextUrl.origin;
  const res = await fetch(`${origin}/api/sync`, {
    method: "GET",
    headers: { "x-sync-secret": secret },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

