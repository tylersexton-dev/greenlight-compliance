"use client";

import { useRef, useState, DragEvent, ClipboardEvent } from "react";

interface ContentDropZoneProps {
  onContent: (text: string) => void;
}

export function ContentDropZone({ onContent }: ContentDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function extractText(file: File): Promise<string> {
    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      return file.text();
    }
    // For PDF/docx: extract plain text via browser FileReader as fallback
    // A real implementation would use pdf.js or a server endpoint
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // Naive extraction: strip non-printable chars from binary files
        const cleaned = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
        if (cleaned.length < 20) {
          reject(new Error("Could not extract readable text. Paste the content manually instead."));
        } else {
          resolve(cleaned);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsText(file);
    });
  }

  async function handleFile(file: File) {
    setProcessing(true);
    setError("");
    try {
      const text = await extractText(file);
      onContent(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read file");
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
        className="rounded-md border border-dashed flex flex-col items-center justify-center py-3 gap-1.5 transition-colors cursor-pointer"
        style={{
          borderColor: dragging ? "var(--color-accent)" : "var(--color-border)",
          backgroundColor: dragging ? "var(--color-accent-light)" : "transparent",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".txt,.md,.pdf,.docx" className="hidden" onChange={onFileInput} />
        <p className="text-xs" style={{ color: "var(--color-text-3)" }}>
          {processing ? "Reading file…" : "Drop a .txt, .md, or .pdf file, or click to browse"}
        </p>
      </div>
      {error && (
        <p className="text-xs mt-1" style={{ color: "var(--color-blocker)" }}>{error}</p>
      )}
    </div>
  );
}
