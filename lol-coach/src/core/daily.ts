import { buildReviewQueue, computeSubjectScores, recommendSubject, type AnswerRecord, type Subject } from './progress';

export interface DailyPlan {
  date: string;
  subject: Subject;
  questionIds: string[];
  /** 当日に正解した課題の問題 */
  doneIds: string[];
  /** 課題の問題が参照する章のうち、最初の未読の章（全部既読なら最初の章） */
  sectionId?: string;
}

const PLAN_SIZE = 3;

const startOfDay = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
};

/**
 * 今日の課題: 推奨科目から3問 + 関連する教科書1章。
 * 当日の回答で課題が入れ替わらないよう、当日0時より前の回答だけで決める。
 */
export function buildDailyPlan(
  date: string,
  quiz: { id: string; subject: Subject; ref: string }[],
  answers: AnswerRecord[],
  read: string[],
): DailyPlan | null {
  const dayStart = startOfDay(date);
  const before = answers.filter((a) => a.at < dayStart);
  const subject = recommendSubject(computeSubjectScores(quiz, before));
  if (!subject) return null;
  const pool = quiz.filter((q) => q.subject === subject);
  const questionIds = buildReviewQueue(
    pool.map((q) => q.id),
    before,
  ).slice(0, PLAN_SIZE);
  const doneIds = questionIds.filter((id) => answers.some((a) => a.questionId === id && a.at >= dayStart && a.correct));
  const refs = questionIds.map((id) => pool.find((q) => q.id === id)!.ref);
  const sectionId = refs.find((r) => !read.includes(r)) ?? refs[0];
  return { date, subject, questionIds, doneIds, sectionId };
}
