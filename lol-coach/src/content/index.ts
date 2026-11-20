import textbookData from './textbook.json';
import workbookQuestionsData from './workbook-questions.json';
import workbookAnswersData from './workbook-answers.json';
import quizData from './quiz.json';
import routesData from './routes.json';
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

export interface JungleRoute {
  id: string;
  name: string;
  camps: string[];
  goal: 'bot' | 'mid' | 'top' | 'flex';
  level?: string;
  when: string;
  ref: string;
}

export type RouteScenario = QuizQuestion & { routeId?: string };

export const routes = routesData.routes as JungleRoute[];
export const routeScenarios = routesData.scenarios as RouteScenario[];
/** 点数・ドリル・今日の課題で使う全問題（4択クイズ + ルート練習） */
export const allQuestions: QuizQuestion[] = [...quiz, ...routeScenarios];
