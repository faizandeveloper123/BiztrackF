import { NextRequest, NextResponse } from "next/server";

function getApiBaseUrl(): string {
  return (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000"
  ).replace(/\/$/, "");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } },
) {
  const code = params.code?.trim();
  if (!code) {
    return NextResponse.json({ detail: "Invalid link" }, { status: 400 });
  }

  const apiBase = getApiBaseUrl();
  const upstream = await fetch(
    `${apiBase}/public/i/${encodeURIComponent(code)}`,
    {
      cache: "no-store",
    },
  );

  if (!upstream.ok) {
    const detail =
      upstream.status === 404
        ? "Invoice link not found or expired"
        : "Could not load invoice PDF";
    return NextResponse.json({ detail }, { status: upstream.status });
  }

  const pdf = await upstream.arrayBuffer();
  const disposition =
    upstream.headers.get("content-disposition") ||
    'attachment; filename="invoice.pdf"';

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "private, no-store",
    },
  });
}

export const dynamic = "force-dynamic";
