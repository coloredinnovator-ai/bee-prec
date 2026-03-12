import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ ok: true, service: "bee-prec-web", timestamp: new Date().toISOString() });
}
