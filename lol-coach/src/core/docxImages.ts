// 元の .docx から図版を章に割り当てる（Word の document.xml を順に読む）

const IMAGE_TYPE = /\/image$/;

const decode = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

/** word/_rels/document.xml.rels から 画像のrId → zip内パス */
export function parseRels(relsXml: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of relsXml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const attr = (name: string) => m[1].match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
    const id = attr('Id');
    const type = attr('Type') ?? '';
    const target = attr('Target');
    if (id && target && IMAGE_TYPE.test(type) && attr('TargetMode') !== 'External') {
      out[id] = target.startsWith('/') ? target.slice(1) : `word/${target.replace(/^\.\//, '')}`;
    }
  }
  return out;
}

/** 見出し比較用: 空白・装飾記号・区切り線を除いて小文字化 */
const norm = (s: string) =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s*\\#_`~\-–—―=]+/g, '')
    .replace(/[[\]「」『』（）()【】]/g, '');

const MAX_HEADING_LEN = 70;
const LOOKAHEAD = 60;

/**
 * 段落を先頭から読み、見出し（章タイトルと一致する短い段落）が来たら現在の章を進める。
 * 画像は、その時点の章に割り当てる。
 */
export function mapDocxImages(documentXml: string, relsXml: string, sections: { id: string; title: string }[]): Record<string, string[]> {
  const rels = parseRels(relsXml);
  const titles = sections.map((s) => norm(s.title));
  const result: Record<string, string[]> = {};
  let current = 0;

  for (const pm of documentXml.matchAll(/<w:p[\s>][\s\S]*?<\/w:p>/g)) {
    const para = pm[0];
    const text = norm(decode([...para.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('')));
    if (text && text.length <= MAX_HEADING_LEN) {
      for (let i = current; i < Math.min(sections.length, current + LOOKAHEAD); i++) {
        const t = titles[i];
        if (t && (text === t || (t.length >= 4 && (text.startsWith(t) || (text.length >= 6 && t.startsWith(text)))))) {
          current = i;
          break;
        }
      }
    }
    for (const im of para.matchAll(/(?:r:embed|r:id)="([^"]+)"/g)) {
      const target = rels[im[1]];
      if (!target || sections.length === 0) continue;
      const id = sections[current].id;
      (result[id] ??= []).includes(target) || result[id].push(target);
    }
  }
  return result;
}
