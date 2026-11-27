import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", app: "otoch" }, { status: 200 });
}
