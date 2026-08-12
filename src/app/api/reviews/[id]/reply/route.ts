import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReviewReplySchema, parseBody } from "@/lib/validators";

// POST /api/reviews/:id/reply
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params;
  const session = await auth();

  const body = await req.json().catch(() => null);
  const parsed = parseBody(ReviewReplySchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { text, userName } = parsed.data;

  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  const reply = await db.reviewReply.create({
    data: {
      reviewId,
      userId:   session?.user?.id ?? null,
      userName: session?.user?.name ?? userName,
      text,
    },
  });

  return NextResponse.json({ reply }, { status: 201 });
}
