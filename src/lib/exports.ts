// Turning deliverables into Gmail drafts and Notion pages, without any OAuth setup.

export interface EmailDraft {
  subject: string;
  body: string;
}

const plain = (md: string) =>
  md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links -> their text
    .replace(/^#+\s*/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** Finds each "Subject: ..." line and the text after it, up to the next subject or heading. */
export function extractEmails(markdown: string): EmailDraft[] {
  const lines = markdown.split("\n");
  const drafts: EmailDraft[] = [];
  let current: { subject: string; body: string[] } | null = null;

  const flush = () => {
    if (current) drafts.push({ subject: current.subject, body: plain(current.body.join("\n")) });
    current = null;
  };

  for (const line of lines) {
    const subject = line.match(/^\s*[*_]*subject[*_]*\s*:[*_]*\s*(.+)$/i);
    if (subject) {
      flush();
      current = { subject: plain(subject[1]), body: [] };
    } else if (/^#{1,3}\s/.test(line) || /^---+\s*$/.test(line)) {
      flush();
    } else if (current) {
      current.body.push(line);
    }
  }
  flush();
  return drafts.filter((d) => d.subject && d.body);
}

/** Gmail's compose window, prefilled. Long bodies are trimmed to keep the URL valid. */
export function gmailComposeUrl({ subject, body }: EmailDraft) {
  const trimmed = body.length > 1800 ? body.slice(0, 1800) + "\n\n[...]" : body;
  return `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(trimmed)}`;
}

/** notion.new opens a blank page; pasting Markdown there keeps headings, lists and tables. */
export const NOTION_NEW_PAGE = "https://notion.new";
