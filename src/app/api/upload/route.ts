import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { limitOrNull, MINUTE } from "@/lib/rate-limit";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Detect the real image type from the file's magic bytes — the client-supplied
// MIME type can't be trusted. SVG is deliberately not allowed (it can carry scripts).
function sniffImageType(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length >= 6 && /^GIF8[79]a$/.test(buf.subarray(0, 6).toString("ascii"))) return "image/gif";
  if (buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

// POST /api/upload
// Body: FormData with a "file" field (image)
// Returns: { url: string } — the Cloudinary CDN URL
// Auth: admin only (product/category/banner images). Review photos are sent
// inline with the review, not through this endpoint.
export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  // Generous for bulk product photo uploads, but caps Cloudinary usage if an
  // admin session is ever abused.
  const limited = await limitOrNull(`upload:user:${session.user.id}`, 100, 10 * MINUTE);
  if (limited) return limited;

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
  const buffer = Buffer.from(await file.arrayBuffer());
  const type   = sniffImageType(buffer);
  if (!type) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP or GIF images are allowed" }, { status: 415 });
  }
  const dataUri = `data:${type};base64,${buffer.toString("base64")}`;

  // Separate folder from the main store so images never mix in shared Cloudinary.
  const folder = "poshakbd/admin";

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
