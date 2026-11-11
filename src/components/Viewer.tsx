"use client";

import { CheckCircle, Copy, DownloadSimple, EnvelopeSimple, FileText, NotionLogo, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Deliverable } from "@/lib/events";
import { extractEmails, gmailComposeUrl, NOTION_NEW_PAGE } from "@/lib/exports";

export function Viewer({ deliverable, onClose }: { deliverable: Deliverable; onClose: () => void }) {
  const [copied, setCopied] = useState<"" | "copy" | "notion">("");
  const emails = useMemo(() => extractEmails(deliverable.content), [deliverable.content]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async (kind: "copy" | "notion") => {
    await navigator.clipboard.writeText(deliverable.content);
    setCopied(kind);
    setTimeout(() => setCopied(""), 2500);
    if (kind === "notion") window.open(NOTION_NEW_PAGE, "_blank", "noopener");
  };

  const download = () => {
    const blob = new Blob([deliverable.content], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${deliverable.title.replace(/[^\w-]+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const button =
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-3 py-1 text-sm transition hover:bg-panel-2";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal>
      <div className="slide-in flex h-full w-full max-w-3xl flex-col border-l border-line bg-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
          <FileText size={16} className="text-accent" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{deliverable.kind}</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button onClick={() => copy("copy")} className={button}>
              {copied === "copy" ? <CheckCircle size={14} weight="fill" className="text-[var(--analyst)]" /> : <Copy size={14} />}
              {copied === "copy" ? "Copied" : "Copy"}
            </button>
            <button onClick={() => copy("notion")} className={button} title="Copies the document and opens a new Notion page to paste it into">
              {copied === "notion" ? <CheckCircle size={14} weight="fill" className="text-[var(--analyst)]" /> : <NotionLogo size={14} />}
              {copied === "notion" ? "Copied, paste in Notion" : "Copy to Notion"}
            </button>
            <button onClick={download} className={button}>
              <DownloadSimple size={14} /> Download
            </button>
            <button onClick={onClose} className="rounded-full p-1.5 text-muted transition hover:bg-panel-2 hover:text-text" aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {emails.length > 0 && (
          <div className="border-b border-line px-5 py-3">
            <p className="mb-2 text-xs text-muted">
              {emails.length === 1 ? "1 email found" : `${emails.length} emails found`}. Open as a Gmail draft, review, then send.
            </p>
            <div className="scroll-thin flex gap-2 overflow-x-auto pb-1">
              {emails.map((email, i) => (
                <a
                  key={i}
                  href={gmailComposeUrl(email)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-[260px] shrink-0 items-center gap-1.5 rounded-full border border-accent/40 px-3 py-1 text-sm transition hover:border-accent hover:bg-panel-2"
                  title={email.subject}
                >
                  <EnvelopeSimple size={14} className="shrink-0 text-accent" />
                  <span className="truncate">{email.subject}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        <article className="md scroll-thin flex-1 overflow-y-auto px-6 py-8 sm:px-10">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: (props) => <a {...props} target="_blank" rel="noreferrer" /> }}>
            {deliverable.content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
