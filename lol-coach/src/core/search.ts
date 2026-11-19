export interface Section {
  id: string;
  title: string;
  level: number;
  body: string;
}

export interface SearchHit {
  id: string;
  title: string;
  count: number;
  snippet: string;
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    count += 1;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return count;
}

export function searchSections(sections: Section[], query: string, limit = 50): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const s of sections) {
    const body = s.body.toLowerCase();
    const count = countOccurrences(body, q) + countOccurrences(s.title.toLowerCase(), q);
    if (count === 0) continue;
    const at = body.indexOf(q);
    const snippet =
      at === -1 ? s.body.slice(0, 80) : (at > 30 ? '…' : '') + s.body.slice(Math.max(0, at - 30), at + q.length + 50).replace(/\n/g, ' ');
    hits.push({ id: s.id, title: s.title, count, snippet });
  }
  return hits.sort((a, b) => b.count - a.count).slice(0, limit);
}
