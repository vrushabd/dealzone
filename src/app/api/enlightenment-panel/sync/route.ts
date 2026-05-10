import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { runProductSync } from "@/lib/features/sync/service";

export const dynamic = "force-dynamic";

export async function POST() {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    return NextResponse.json(await runProductSync("manual"));
  } catch (error) {
    console.error("Admin sync error:", error);
    return NextResponse.json({ error: "Failed to run sync" }, { status: 500 });
  }
}

