import { NextResponse } from "next/server";
import { buildReconciliation, toCsv } from "@/lib/reports";

export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/reports/reconciliation?from=YYYY-MM-DD&to=YYYY-MM-DD&format=csv
export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  if ((from && !DATE.test(from)) || (to && !DATE.test(to))) {
    return NextResponse.json({ error: "Format tanggal YYYY-MM-DD" }, { status: 400 });
  }
  const rows = await buildReconciliation(from, to);
  if (url.searchParams.get("format") === "csv") {
    return new NextResponse(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="rekonsiliasi-${from ?? "awal"}-${to ?? "kini"}.csv"`,
      },
    });
  }
  return NextResponse.json({ rows });
}
