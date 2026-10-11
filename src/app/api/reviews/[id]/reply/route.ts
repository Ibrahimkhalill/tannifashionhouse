import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReviewReplySchema, parseBody } from "@/lib/validators";
import { limitOrNull, HOUR } from "@/lib/rate-limit";

// POST /api/reviews/:id/reply
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params;
  const session = await auth();

  // Sign-in required: the displayed name always comes from the account, so
  // nobody can post a reply pretending to be the store or another customer.
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to reply" }, { status: 401 });
  }

  const limited = await limitOrNull(`reply:user:${session.user.id}`, 20, HOUR);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = parseBody(ReviewReplySchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { text } = parsed.data;

  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  const reply = await db.reviewReply.create({
    data: {
      reviewId,
      userId:   session.user.id,
      userName: session.user.name || "Customer",
      text,
    },
  });

  return NextResponse.json({ reply }, { status: 201 });
}
