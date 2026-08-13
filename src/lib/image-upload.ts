"use client";

import { uploadImage } from "@/lib/api-client";

// Browser-side resize + JPEG compress, then upload to Cloudinary → returns the CDN URL.
//
// Why: the admin previously embedded picked images as base64 data URIs in the
// product-save JSON. A few phone photos (3000×4000px, several MB each) blew past
// Vercel's ~4.5 MB serverless body limit → "FUNCTION_PAYLOAD_TOO_LARGE". Uploading
// each file to Cloudinary first means the save payload only carries short URLs,
// and shrinking client-side keeps every upload well under the limit + loads faster.
// URLs uploaded during THIS editing session that haven't been committed by a save
// yet. If the user removes such an image (wrong photo → remove → re-upload), we can
// safely delete it from Cloudinary so orphans don't pile up. Cleared on save so a
// committed/saved image is never auto-deleted later.
const sessionUploads = new Set<string>();

export async function compressAndUpload(file: File, maxDim = 1600, quality = 0.82): Promise<string> {
  const prepared = await shrink(file, maxDim, quality).catch(() => file);
  const url = await uploadImage(prepared);
  sessionUploads.add(url);
  return url;
}

// Delete an image from Cloudinary ONLY if it was uploaded this session and not yet
// saved. Safe no-op for pre-existing/saved images and pasted URLs.
export async function discardUpload(url?: string): Promise<void> {
  if (!url || !sessionUploads.has(url)) return;
  sessionUploads.delete(url);
  try {
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch { /* best-effort cleanup */ }
}

// After a successful save the session's uploads are committed — never auto-delete
// them on a later remove (they may still be referenced by the saved product).
export function commitUploads(): void {
  sessionUploads.clear();
}

async function shrink(file: File, maxDim: number, quality: number): Promise<File> {
  // Leave non-raster / animated formats untouched.
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("decode failed"));
      im.src = url;
    });

    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    // Already small + light — no need to re-encode.
    if (scale === 1 && file.size <= 1_200_000) return file;

    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
