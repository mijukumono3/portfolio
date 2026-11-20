// 教科書「ソロランクは7科目の試験」に基づく科目別スコアと復習キュー

export type Subject = 'top' | 'jungle' | 'mid' | 'adc' | 'support' | 'macro' | 'teamfight';

export const SUBJECTS: Subject[] = ['top', 'jungle', 'mid', 'adc', 'support', 'macro', 'teamfight'];

export const SUBJECT_LABEL: Record<Subject, string> = {
  top: 'TOP',
  jungle: 'JG',
  mid: 'MID',
  adc: 'ADC',
  support: 'SUP',
  macro: 'マクロ',
  teamfight: '集団戦',
};

export interface AnswerRecord {
  questionId: string;
  correct: boolean;
  at: number;
}

export interface SubjectScore {
  score: number | null;
  answered: number;
  total: number;
}

function latestByQuestion(history: AnswerRecord[]): Map<string, AnswerRecord> {
  const latest = new Map<string, AnswerRecord>();
  for (const r of history) {
    const prev = latest.get(r.questionId);
    if (!prev || r.at >= prev.at) latest.set(r.questionId, r);
  }
  return latest;
}

export function computeSubjectScores(
  questions: { id: string; subject: Subject }[],
  history: AnswerRecord[],
): Record<Subject, SubjectScore> {
  const latest = latestByQuestion(history);
  const result = Object.fromEntries(SUBJECTS.map((s) => [s, { score: null, answered: 0, total: 0 }])) as Record<Subject, SubjectScore>;
  const correct: Record<string, number> = {};
  for (const q of questions) {
    const s = result[q.subject];
    s.total += 1;
    const r = latest.get(q.id);
    if (r) {
      s.answered += 1;
      correct[q.subject] = (correct[q.subject] ?? 0) + (r.correct ? 1 : 0);
    }
  }
  for (const subject of SUBJECTS) {
    const s = result[subject];
    if (s.answered > 0) s.score = Math.round(((correct[subject] ?? 0) / s.answered) * 100);
  }
  return result;
}

/** 次に学ぶべき科目: 問題があるのに未着手の科目 → 最低点の科目 */
export function recommendSubject(scores: Record<Subject, SubjectScore>): Subject | null {
  const available = SUBJECTS.filter((s) => scores[s].total > 0);
  if (available.length === 0) return null;
  const untouched = available.find((s) => scores[s].score === null);
  if (untouched) return untouched;
  return available.reduce((low, s) => ((scores[s].score ?? 0) < (scores[low].score ?? 0) ? s : low));
}

/** 復習キュー: 最新回答が誤答 → 未回答 → 正解済み（各グループ内は元の順） */
export function buildReviewQueue(questionIds: string[], history: AnswerRecord[]): string[] {
  const latest = latestByQuestion(history);
  const wrong = questionIds.filter((id) => latest.get(id)?.correct === false);
  const unanswered = questionIds.filter((id) => !latest.has(id));
  const done = questionIds.filter((id) => latest.get(id)?.correct === true);
  return [...wrong, ...unanswered, ...done];
}
