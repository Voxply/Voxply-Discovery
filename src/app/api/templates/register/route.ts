import { NextRequest, NextResponse } from "next/server";
import { verifySignature } from "@/lib/verify";
import { registerTemplate, deleteTemplate } from "@/lib/templates-db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body?.template_id || !body?.name || !body?.author_pubkey || !body?.payload || !body?.signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (typeof body.template_id !== "string" || body.template_id.length > 64) {
    return NextResponse.json({ error: "template_id must be a string of 64 chars or fewer" }, { status: 400 });
  }
  if (typeof body.name !== "string" || body.name.length > 64) {
    return NextResponse.json({ error: "name must be 64 characters or fewer" }, { status: 400 });
  }
  if (body.description !== undefined && (typeof body.description !== "string" || body.description.length > 500)) {
    return NextResponse.json({ error: "description must be 500 characters or fewer" }, { status: 400 });
  }
  if (body.version !== undefined && (typeof body.version !== "string" || body.version.length > 20)) {
    return NextResponse.json({ error: "version must be 20 characters or fewer" }, { status: 400 });
  }
  if (body.tags !== undefined && !Array.isArray(body.tags)) {
    return NextResponse.json({ error: "tags must be an array" }, { status: 400 });
  }
  if (Array.isArray(body.tags) && (body.tags.length > 20 || body.tags.some((t) => typeof t !== "string" || t.length > 50))) {
    return NextResponse.json({ error: "tags must be at most 20 strings of 50 chars each" }, { status: 400 });
  }

  const payloadStr = typeof body.payload === "string" ? body.payload : JSON.stringify(body.payload);
  if (payloadStr.length > 65536) {
    return NextResponse.json({ error: "payload must be 64 KB or smaller" }, { status: 400 });
  }

  const valid = await verifySignature(
    body.author_pubkey as string,
    body.signature as string,
    payloadStr,
  );
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const result = registerTemplate({
    template_id: body.template_id as string,
    name: body.name as string,
    description: body.description as string | undefined,
    author_pubkey: body.author_pubkey as string,
    version: body.version as string | undefined,
    payload: payloadStr,
    signature: body.signature as string,
    tags: Array.isArray(body.tags) ? (body.tags as string[]) : undefined,
  });

  if (result.status === "forbidden") {
    return NextResponse.json({ error: "not_author" }, { status: 403 });
  }

  return NextResponse.json({ ok: true }, { status: result.status === "created" ? 201 : 200 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body?.template_id || !body?.author_pubkey || !body?.signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const templateId = body.template_id as string;
  const authorPubkey = body.author_pubkey as string;
  const signature = body.signature as string;

  const valid = await verifySignature(authorPubkey, signature, templateId);
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const result = deleteTemplate(templateId, authorPubkey);

  if (result.status === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (result.status === "forbidden") {
    return NextResponse.json({ error: "not_author" }, { status: 403 });
  }

  return new NextResponse(null, { status: 204 });
}
