import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runProductSync } from "@/lib/features/sync/service";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json(await runProductSync("manual"));
  } catch (error) {
    console.error("Admin sync error:", error);
    return NextResponse.json({ error: "Failed to run sync" }, { status: 500 });
  }
}

