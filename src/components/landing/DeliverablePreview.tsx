import { Copy, DownloadSimple, FileText, X } from "@phosphor-icons/react/dist/ssr";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// The real deliverable viewer markup, rendered with sample content.
const SAMPLE = `# Target Account Shortlist

Ten funded D2C skincare brands, scored on fit and timing. Funding details link to their sources.

| # | Brand | Why now | Fit |
|---|---|---|---|
| 1 | RAS Luxury Skincare | Series B, expanding offline retail | High |
| 2 | Asaya | Series A, entering new cities | High |
| 3 | CHOSEN | Series A, scaling clinical education | High |
| 4 | Deconstruct | New funding, hiring growth roles | Medium |

**Scoring:** fit with the buyer profile (50%), timing trigger (30%), reachable decision maker (20%).

> Funding figures come from the sources listed under each brand. Verify them before outreach.`;

export function DeliverablePreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel" aria-label="Example deliverable">
      <div className="flex items-center gap-2 border-b border-line px-5 py-3">
        <FileText size={16} className="text-accent" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">leads</span>
        <div className="ml-auto flex items-center gap-2" aria-hidden>
          <span className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm sm:inline-flex">
            <Copy size={14} /> Copy
          </span>
          <span className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm sm:inline-flex">
            <DownloadSimple size={14} /> Download
          </span>
          <span className="p-1.5 text-muted">
            <X size={16} />
          </span>
        </div>
      </div>
      <article className="md px-6 py-8 text-left sm:px-12 sm:py-10">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{SAMPLE}</ReactMarkdown>
      </article>
    </div>
  );
}
