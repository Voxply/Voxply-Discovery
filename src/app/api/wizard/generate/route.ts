import { NextRequest, NextResponse } from "next/server";
import { createBootstrapToken } from "@/lib/bootstrap-db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const config = {
    name: (body.name as string | undefined) ?? "My Hub",
    description: (body.description as string | undefined) ?? "",
    tags: Array.isArray(body.tags) ? body.tags : [],
    channels: Array.isArray(body.channel_names)
      ? (body.channel_names as string[]).map((n) => ({ name: n, type: "text" }))
      : [],
    template_id: (body.template_id as string | null | undefined) ?? null,
  };
  const token = createBootstrapToken(config);
  return NextResponse.json({ token });
}
