import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/upload
// Body: FormData with a "file" field (image)
// Returns: { url: string } — the Cloudinary CDN URL
// Auth: any logged-in user OR admin uploading product/category images
export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Max 5 MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 });
  }

  // Convert Blob to base64 data URI for Cloudinary upload
  const buffer  = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  // Separate folder from the main store so images never mix in shared Cloudinary.
  const folder = session.user.role === "ADMIN" ? "poshakbd/admin" : "poshakbd/reviews";

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    transformation: [{ quality: "auto", fetch_format: "auto" }],
    // Auto-generate a public_id based on content hash
    unique_filename: true,
  });

  return NextResponse.json({ url: result.secure_url });
}

// DELETE /api/upload  — Body: { url } (a Cloudinary URL from our folder)
// Removes an uploaded image from Cloudinary. Admin-only; used to clean up images
// the admin uploaded but then removed before saving (so orphans don't pile up).
export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { url } = await req.json().catch(() => ({}));
  const publicId = publicIdFromUrl(url);
  // Guard: only ever touch our own folder so a bad URL can't delete anything else.
  if (!publicId || !publicId.startsWith("poshakbd/")) {
    return NextResponse.json({ error: "Not a deletable image" }, { status: 400 });
  }

  await cloudinary.uploader.destroy(publicId).catch(() => {});
  return NextResponse.json({ ok: true });
}

// Extract the Cloudinary public_id (folder/name, no version, no extension) from a
// secure_url like https://res.cloudinary.com/<cloud>/image/upload/v123/poshakbd/admin/x.jpg
function publicIdFromUrl(url?: string): string | null {
  if (typeof url !== "string") return null;
  const after = url.split("/upload/")[1];
  if (!after) return null;
  return after.replace(/^v\d+\//, "").replace(/\.[a-zA-Z0-9]+$/, "");
}
