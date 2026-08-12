"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Link2, Quote, Undo, Redo, RemoveFormatting, ImagePlus, X,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

function ToolBtn({ active, onClick, title, children }: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} onClick={onClick}
      className={`size-7 flex items-center justify-center rounded-md transition text-sm ${
        active ? "bg-[#0f172a] text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}>
      {children}
    </button>
  );
}

export function RichTextEditor({
  value, onChange, placeholder = "Write a detailed product description...", minHeight = 200,
}: Props) {
  const [linkOpen, setLinkOpen]     = useState(false);
  const [linkHref, setLinkHref]     = useState("");
  const [headingOpen, setHeadingOpen] = useState(false);
  const [imgOpen, setImgOpen]       = useState(false);
  const [imgTab, setImgTab]         = useState<"upload" | "url">("upload");
  const [imgUrl, setImgUrl]         = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      Image.configure({ inline: false, allowBase64: true }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "prose prose-sm max-w-none outline-none px-4 py-3 min-h-[inherit] text-slate-800" },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) editor.commands.setContent(value ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value === "" || !editor ? value : null, editor]);

  if (!editor) return null;

  const getHeadingLabel = () => {
    if (editor.isActive("heading", { level: 1 })) return "Heading 1";
    if (editor.isActive("heading", { level: 2 })) return "Heading 2";
    if (editor.isActive("heading", { level: 3 })) return "Heading 3";
    return "Normal";
  };

  const applyLink = () => {
    if (!linkHref) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: linkHref }).run();
    setLinkHref(""); setLinkOpen(false);
  };

  // Insert image from URL
  const insertImgUrl = () => {
    const u = imgUrl.trim();
    if (!u) return;
    editor.chain().focus().setImage({ src: u }).run();
    setImgUrl(""); setImgOpen(false);
  };

  // Insert image from file (FileReader → base64)
  const insertImgFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Only image files"); return; }
    if (file.size > 8 * 1024 * 1024)    { toast.error("Max 8 MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      editor.chain().focus().setImage({ src: e.target?.result as string }).run();
      setImgOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const closeAll = () => { setHeadingOpen(false); setLinkOpen(false); setImgOpen(false); };

  return (
    <div className="border border-slate-200 rounded-xl overflow-visible focus-within:border-red-400 transition bg-white">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2.5 py-1.5 border-b border-slate-100 bg-slate-50/80 rounded-t-xl">

        {/* Heading dropdown */}
        <div className="relative">
          <button type="button" onClick={() => { closeAll(); setHeadingOpen((o) => !o); }}
            className="flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 transition whitespace-nowrap">
            {getHeadingLabel()}
            <svg className="size-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
            </svg>
          </button>
          {headingOpen && (
            <div className="absolute top-8 left-0 z-50 bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[140px]">
              {[
                { label: "Normal",    action: () => editor.chain().focus().setParagraph().run() },
                { label: "Heading 1", action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
                { label: "Heading 2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
                { label: "Heading 3", action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
              ].map((item) => (
                <button key={item.label} type="button"
                  onClick={() => { item.action(); setHeadingOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition">
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Text formatting */}
        <ToolBtn active={editor.isActive("bold")}      onClick={() => editor.chain().focus().toggleBold().run()}      title="Bold"><Bold className="size-3.5" /></ToolBtn>
        <ToolBtn active={editor.isActive("italic")}    onClick={() => editor.chain().focus().toggleItalic().run()}    title="Italic"><Italic className="size-3.5" /></ToolBtn>
        <ToolBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon className="size-3.5" /></ToolBtn>
        <ToolBtn active={editor.isActive("strike")}    onClick={() => editor.chain().focus().toggleStrike().run()}    title="Strikethrough"><Strikethrough className="size-3.5" /></ToolBtn>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Lists */}
        <ToolBtn active={editor.isActive("bulletList")}  onClick={() => editor.chain().focus().toggleBulletList().run()}  title="Bullet List"><List className="size-3.5" /></ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List"><ListOrdered className="size-3.5" /></ToolBtn>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Alignment */}
        <ToolBtn active={editor.isActive({ textAlign: "left" })}   onClick={() => editor.chain().focus().setTextAlign("left").run()}   title="Align Left"><AlignLeft className="size-3.5" /></ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align Center"><AlignCenter className="size-3.5" /></ToolBtn>
        <ToolBtn active={editor.isActive({ textAlign: "right" })}  onClick={() => editor.chain().focus().setTextAlign("right").run()}  title="Align Right"><AlignRight className="size-3.5" /></ToolBtn>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Blockquote */}
        <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote"><Quote className="size-3.5" /></ToolBtn>

        {/* Link */}
        <div className="relative">
          <ToolBtn active={editor.isActive("link")}
            onClick={() => { setLinkHref(editor.getAttributes("link").href ?? ""); closeAll(); setLinkOpen((o) => !o); }}
            title="Insert Link">
            <Link2 className="size-3.5" />
          </ToolBtn>
          {linkOpen && (
            <div className="absolute top-8 left-0 z-50 bg-white rounded-xl shadow-lg border border-slate-200 p-3 w-64">
              <p className="text-xs font-semibold text-slate-600 mb-2">Insert Link</p>
              <input value={linkHref} onChange={(e) => setLinkHref(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyLink()}
                className="w-full h-8 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-red-400 transition"
                placeholder="https://..." autoFocus />
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={applyLink} className="flex-1 h-7 rounded-lg bg-[#ef4444] text-white text-xs font-semibold">Apply</button>
                <button type="button" onClick={() => { editor.chain().focus().unsetLink().run(); setLinkOpen(false); }} className="flex-1 h-7 rounded-lg border border-slate-200 text-xs text-slate-600">Remove</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Image insert ─────────────────────────────────────────────── */}
        <div className="relative">
          <ToolBtn active={imgOpen} onClick={() => { closeAll(); setImgOpen((o) => !o); }} title="Insert Image">
            <ImagePlus className="size-3.5" />
          </ToolBtn>

          {imgOpen && (
            <div className="absolute top-8 left-0 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-72">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Insert Image</p>
                <button type="button" onClick={() => setImgOpen(false)}
                  className="size-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 transition">
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Tab toggle */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-3">
                <button type="button" onClick={() => setImgTab("upload")}
                  className={`flex-1 h-7 rounded-lg text-xs font-semibold transition ${imgTab === "upload" ? "bg-white shadow text-slate-800" : "text-slate-500"}`}>
                  Upload File
                </button>
                <button type="button" onClick={() => setImgTab("url")}
                  className={`flex-1 h-7 rounded-lg text-xs font-semibold transition ${imgTab === "url" ? "bg-white shadow text-slate-800" : "text-slate-500"}`}>
                  Paste URL
                </button>
              </div>

              {imgTab === "upload" ? (
                /* File upload */
                <div>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-red-400 hover:bg-red-50/30 rounded-xl py-6 flex flex-col items-center gap-2 cursor-pointer transition">
                    <ImagePlus className="size-7 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600">Click to upload</p>
                    <p className="text-[10px] text-slate-400">PNG, JPG, WebP up to 8 MB</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) insertImgFile(f); e.target.value = ""; }} />
                </div>
              ) : (
                /* URL input */
                <div className="space-y-2">
                  <input value={imgUrl} onChange={(e) => setImgUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && insertImgUrl()}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition"
                    placeholder="https://example.com/image.jpg" autoFocus />
                  <button type="button" onClick={insertImgUrl}
                    className="w-full h-9 rounded-xl bg-[#ef4444] hover:bg-red-600 text-white text-xs font-semibold transition">
                    Insert Image
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Undo / Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo className="size-3.5" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo className="size-3.5" /></ToolBtn>

        {/* Clear formatting */}
        <ToolBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear Formatting">
          <RemoveFormatting className="size-3.5" />
        </ToolBtn>
      </div>

      {/* ── Editor area ───────────────────────────────────────────────────── */}
      <div style={{ minHeight }} onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>

      {/* Close dropdowns on outside click */}
      {(headingOpen || linkOpen || imgOpen) && (
        <div className="fixed inset-0 z-40" onClick={closeAll} />
      )}

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left; color: #94a3b8; pointer-events: none; height: 0;
        }
        .ProseMirror:focus { outline: none; }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0; }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 0.5rem 0; }
        .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; margin: 0.5rem 0; }
        .ProseMirror ul { list-style: disc; padding-left: 1.25rem; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.25rem; }
        .ProseMirror blockquote { border-left: 3px solid #e2e8f0; padding-left: 1rem; color: #64748b; font-style: italic; }
        .ProseMirror a { color: #ef4444; text-decoration: underline; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror s { text-decoration: line-through; }
        .ProseMirror u { text-decoration: underline; }
        .ProseMirror img {
          max-width: 100%; height: auto; border-radius: 0.5rem;
          margin: 0.75rem 0; border: 1px solid #e2e8f0;
          display: block; cursor: pointer;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid #ef4444; border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
}
