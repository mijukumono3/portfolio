// 『LOLの教科書』のテキスト（Google ドキュメント書き出し）を章・ワークブック設問に変換する純粋関数群。

/** Markdown のエスケープや装飾記号を取り除き、読める本文にする */
export function cleanLine(line) {
  return line
    .replace(/&#10;/g, ' ')
    .replace(/<!--.*?-->/g, '')
    .replace(/\[\]\([^)]*\)/g, '') // 空リンク（画像の名残）
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]*\)/g, '$1')
    .replace(/\\([\\*\[\]~_#`>.\-()!+{}|])/g, '$1')
    .replace(/\*{2,}/g, '')
    .replace(/(^|\s)\*(?=\S)|(?<=\S)\*(?=\s|$)/g, '$1')
    .replace(/ð/g, '→')
    .replace(/[\u0080-\u009f]/g, '')
    .replace(/^-{3,}/, '')
    .replace(/\s+$/g, '')
    .trimEnd();
}

const HEADING_RE = /^(?:\d+\.\s+)?(#{1,4})\s+(.*)$/;

/** 見出し行なら {level, title} を返す。本文が誤って # で始まっているだけの長文は見出しとみなさない */
export function parseHeading(rawLine) {
  const m = rawLine.match(HEADING_RE);
  if (!m) return null;
  const title = cleanLine(m[2].replace(/\*{4}放\*{2}/g, ''))
    .replace(/^[#\s]+/, '')
    .replace(/\s*-{3,}\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!title || title.length > 60) return null;
  // 文の途中（句読点や助詞で終わる）は本文の断片
  if (/[。、がをにはでて]$/.test(title)) return null;
  return { level: m[1].length, title };
}

/** テキスト全体を章（見出し単位のセクション）配列に分割する */
export function parseSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = [];
  let current = { title: 'はじめに', level: 1, lines: [] };
  const flush = () => {
    const body = current.lines
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    const isEmptyPreamble = sections.length === 0 && !body && current.title === 'はじめに';
    if (!isEmptyPreamble) sections.push({ title: current.title, level: current.level, body });
  };
  for (const raw of lines) {
    const h = parseHeading(raw);
    if (h) {
      flush();
      current = { title: h.title, level: h.level, lines: [] };
    } else {
      const cleaned = cleanLine(raw.replace(/^(#{1,4})\s+/, ''));
      current.lines.push(cleaned.trim() === '' ? '' : cleaned);
    }
  }
  flush();
  return sections
    .filter((s) => s.body.length > 0 || s.level <= 2)
    .map((s, i) => ({ id: `s${String(i + 1).padStart(3, '0')}`, ...s }));
}

const Q_START_RE = /^(?:Q(\d+)\.\s*(.*)|\d+\.\s+(\(p\.[^)]*\))\s*(.*))$/;

/** ワークブック設問を抽出する。各設問は「回答記入」欄までを本文とする */
export function parseWorkbook(text) {
  const lines = text.split(/\r?\n/).map((l) => cleanLine(l));
  const questions = [];
  let book = '';
  let part = '';
  let q = null;
  let numberedInBook = 0;
  const finish = () => {
    if (q) {
      const body = q.lines.join('\n').replace(/\n{2,}/g, '\n').trim();
      questions.push({ id: `wb${String(questions.length + 1).padStart(2, '0')}`, book, part, title: q.title, body });
      q = null;
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/^#+\s*/, '').trim();
    const isBookTitle = (/ワークブック/.test(line) && raw.startsWith('#')) || /思考ドリル：/.test(line);
    if (isBookTitle) {
      finish();
      book = line.replace(/\(p\.[^)]*\)/, '').replace(/：.*$/, '').trim();
      numberedInBook = 0;
      continue;
    }
    if (/^Part\s*\d+\./.test(line)) {
      finish();
      part = line;
      continue;
    }
    const m = line.match(Q_START_RE);
    if (m && book) {
      finish();
      if (m[1]) {
        q = { title: `Q${m[1]}. ${m[2]}`.trim(), lines: [] };
      } else {
        numberedInBook += 1;
        q = { title: `Q${numberedInBook}. ${m[3]}`, lines: [m[4]] };
      }
      continue;
    }
    if (q) {
      if (/回答記入/.test(line)) {
        finish();
      } else if (line) {
        q.lines.push(line);
      }
    }
  }
  finish();
  return questions;
}
