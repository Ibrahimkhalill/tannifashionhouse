"use client";

import { useRef, useState } from "react";
import { Upload, X, ImagePlus, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { compressAndUpload, discardUpload } from "@/lib/image-upload";

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUploadZone({ images, onChange, maxImages = 6 }: Props) {
  const fileRef    = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [drag, setDrag] = useState(false);
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);

  // Upload each picked file to Cloudinary (compressed) and store URLs — never base64.
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const room = maxImages - images.length;
    if (room <= 0) { toast.error(`Max ${maxImages} images`); return; }
    const pick = Array.from(files).filter((f) => {
      if (!f.type.startsWith("image/")) { toast.error("Only image files allowed"); return false; }
      if (f.size > 20 * 1024 * 1024) { toast.error("Image must be under 20 MB"); return false; }
      return true;
    }).slice(0, room);
    if (!pick.length) return;

    setUploading(true);
    const t = toast.loading(`Uploading ${pick.length} image${pick.length > 1 ? "s" : ""}…`);
    try {
      const urls: string[] = [];
      for (const f of pick) {
        try { urls.push(await compressAndUpload(f)); }
        catch { toast.error(`Failed to upload ${f.name}`); }
      }
      toast.dismiss(t);
      if (urls.length) { onChange([...images, ...urls]); toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`); }
    } finally {
      setUploading(false);
    }
  };

  const addUrl = () => {
    const u = url.trim();
    if (!u) return;
    if (images.length >= maxImages) { toast.error(`Max ${maxImages} images`); return; }
    if (images.includes(u)) { toast.error("Already added"); return; }
    onChange([...images, u]);
    setUrl("");
  };

  const remove = (i: number) => {
    discardUpload(images[i]);   // free the Cloudinary image if it was an unsaved session upload
    onChange(images.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-3">
      {/* Tab toggle */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button type="button" onClick={() => setTab("upload")}
          className={`h-7 px-3 rounded-lg text-xs font-semibold transition ${tab === "upload" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
          <Upload className="size-3 inline mr-1" /> Upload File
        </button>
        <button type="button" onClick={() => setTab("url")}
          className={`h-7 px-3 rounded-lg text-xs font-semibold transition ${tab === "url" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
          <Link2 className="size-3 inline mr-1" /> Paste URL
        </button>
      </div>

      {tab === "upload" ? (
        /* Drag-and-drop zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => !uploading && fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-8 gap-3 transition ${uploading ? "cursor-wait opacity-70" : "cursor-pointer"} ${
            drag ? "border-[#ef4444] bg-red-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            {uploading ? <Loader2 className="size-6 text-slate-400 animate-spin" /> : <ImagePlus className="size-6 text-slate-400" />}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">{uploading ? "Uploading…" : "Click to upload or drag & drop"}</p>
            <p className="text-xs text-slate-400 mt-0.5">{images.length} of {maxImages} images uploaded · JPG, PNG, WebP</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
        </div>
      ) : (
        /* URL input */
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addUrl()}
            className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition"
            placeholder="https://example.com/image.jpg"
          />
          <button type="button" onClick={addUrl}
            className="h-10 px-4 rounded-xl bg-[#ef4444] hover:bg-red-600 text-white text-sm font-semibold transition whitespace-nowrap">
            Add URL
          </button>
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {images.map((src, i) => (
            <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <img src={src} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
              {/* Always-visible remove button (top-right) — works on touch/mobile */}
              <button type="button" onClick={() => remove(i)} aria-label="Remove image"
                className="absolute top-1.5 right-1.5 z-10 size-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md transition hover:bg-red-600">
                <X className="size-3.5" />
              </button>
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 bg-[#0f172a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">MAIN</span>
              )}
              <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">{i + 1}</span>
            </div>
          ))}

          {/* Empty slots */}
          {images.length < maxImages && Array.from({ length: Math.min(2, maxImages - images.length) }).map((_, i) => (
            <button key={`empty-${i}`} type="button" onClick={() => { setTab("upload"); fileRef.current?.click(); }}
              className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-red-300 hover:bg-red-50/30 flex items-center justify-center transition">
              <ImagePlus className="size-5 text-slate-300" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
