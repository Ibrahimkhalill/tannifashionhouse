import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// Map known Prisma errors to clean HTTP responses the admin UI can show,
// instead of letting them surface as raw 500s.
export function prismaErrorResponse(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case "P2002": { // unique constraint
        const target = (e.meta?.target as string[] | string | undefined) ?? "";
        const field = Array.isArray(target) ? target.join(", ") : String(target);
        return NextResponse.json(
          { error: field ? `A record with this ${field} already exists` : "This record already exists" },
          { status: 409 },
        );
      }
      case "P2025": // record not found (update/delete)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      case "P2003": // foreign key — still referenced elsewhere
        return NextResponse.json(
          { error: "This record is still in use and can't be deleted" },
          { status: 409 },
        );
    }
  }
  console.error("[api] unexpected error:", e);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
