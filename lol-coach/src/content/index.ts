import textbookData from './textbook.json';
import workbookQuestionsData from './workbook-questions.json';
import workbookAnswersData from './workbook-answers.json';
import quizData from './quiz.json';
import type { Section } from '../core/search';
import type { Subject } from '../core/progress';

export interface QuizQuestion {
  id: string;
  subject: Subject;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
  ref: string;
}

export interface WorkbookQuestion {
  id: string;
  book: string;
  part: string;
  title: string;
  body: string;
}

export interface WorkbookAnswer {
  answer: string;
  refs: string[];
}

export const sections = textbookData as Section[];
export const quiz = quizData as QuizQuestion[];
export const workbookQuestions = workbookQuestionsData as WorkbookQuestion[];
export const workbookAnswers = workbookAnswersData as Record<string, WorkbookAnswer>;

const sectionIndex = new Map(sections.map((s) => [s.id, s]));
export const getSection = (id: string) => sectionIndex.get(id);
