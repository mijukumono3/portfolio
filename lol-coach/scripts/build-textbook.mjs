// 使い方: node scripts/build-textbook.mjs [入力テキスト]
import { readFileSync, writeFileSync } from 'node:fs';
import { parseSections, parseWorkbook } from './textbook-parser.mjs';

const input = process.argv[2] ?? new URL('../content-src/lol-textbook.txt', import.meta.url);
const text = readFileSync(input, 'utf8');
const sections = parseSections(text);
const workbook = parseWorkbook(text);
writeFileSync(new URL('../src/content/textbook.json', import.meta.url), JSON.stringify(sections, null, 1));
writeFileSync(new URL('../src/content/workbook-questions.json', import.meta.url), JSON.stringify(workbook, null, 1));
console.log(`sections: ${sections.length}, workbook questions: ${workbook.length}`);
