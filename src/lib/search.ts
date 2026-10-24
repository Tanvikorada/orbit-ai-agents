import type { Source } from "./events";

export interface SearchResult extends Source {
  content: string;
}

// Web search through Tavily (free tier: 1,000 searches a month).
export async function tavilySearch(query: string, signal: AbortSignal): Promise<SearchResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, search_depth: "basic", max_results: 5, chunks_per_source: 2 }),
    signal,
  });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const data = (await res.json()) as { results?: SearchResult[] };
  return (data.results ?? []).map(({ title, url, content }) => ({ title, url, content }));
}
