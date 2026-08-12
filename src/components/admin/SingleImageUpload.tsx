"use client";

import { useRef, useState } from "react";
import { Upload, X, ImagePlus, Link2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (image: string) => void;
  /** Optional label under the drop zone, e.g. "Logo" */
  hint?: string;
}

/**
 * Single-image picker for admin forms — upload a file (stored as base64,
 * same as ImageUploadZone) or paste a URL. Shows a live preview with remove.
 */
export function SingleImageUpload({ value, onChange, hint }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [drag, setDrag] = useState(false);
  const [tab, setTab] = useState<"upload" | "url">("upload");

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Only image files allowed"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8 MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const addUrl = () => {
    const u = url.trim();
    if (!u) return;
    onChange(u);
    setUrl("");
  };

  return (
    <div className="space-y-2.5">
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
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 py-5 px-4 cursor-pointer transition ${
            drag ? "border-[#ef4444] bg-red-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <ImagePlus className="size-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Click to upload or drag &amp; drop</p>
            <p className="text-xs text-slate-400 mt-0.5">{hint ?? "PNG, JPG, WebP up to 8MB"}</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }} />
        </div>
      ) : (
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
            Add
          </button>
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="group relative inline-block">
          <img src={value} alt="Preview" className="h-24 w-auto max-w-full rounded-xl object-cover border border-slate-200 bg-slate-50" />
          <button type="button" onClick={() => onChange("")}
            aria-label="Remove image"
            className="absolute -top-2 -right-2 size-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition">
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
