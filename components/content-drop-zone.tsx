"use client";

import { useRef, useState, DragEvent } from "react";

interface ContentDropZoneProps {
  onContent: (text: string) => void;
}

// Supports .txt and .md only — plain text extraction is reliable and testable.
// PDF ingestion requires server-side extraction (pdf.js or pdfminer) and is a roadmap item.
export function ContentDropZone({ onContent }: ContentDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const allowedExt = [".txt", ".md"];
    const isAllowed = allowedExt.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!isAllowed) {
      setError("Only .txt and .md files are supported. For PDFs, copy and paste the text directly.");
      return;
    }

    setProcessing(true);
    setError("");
    try {
      const text = await file.text();
      if (text.trim().length === 0) {
        setError("File appears to be empty.");
        return;
      }
      onContent(text);
    } catch {
      setError("Failed to read file.");
    } finally {
      setProcessing(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div>
      <div
        className="rounded-md border border-dashed flex flex-col items-center justify-center py-3 gap-1 transition-colors cursor-pointer"
        style={{
          borderColor: dragging ? "var(--color-accent)" : "var(--color-border)",
          backgroundColor: dragging ? "var(--color-accent-light)" : "transparent",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".txt,.md" className="hidden" onChange={onFileInput} />
        <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
          {processing ? "Reading file…" : "Drop a .txt or .md file, or click to browse"}
        </p>
      </div>
      {error && (
        <p className="text-xs mt-1" style={{ color: "var(--color-blocker)" }}>{error}</p>
      )}
    </div>
  );
}
