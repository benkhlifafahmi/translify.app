import { api } from "./api";

export interface QuizQuestion {
  id: string;
  type: string;
  prompt: string;
  choices: string[];
}

export interface Quiz {
  id: string;
  book_id: string;
  title: string;
  scope_label: string | null;
  questions: QuizQuestion[];
  created_at: string;
}

export interface QuizSummary {
  id: string;
  book_id: string;
  title: string;
  scope_label: string | null;
  question_count: number;
  created_at: string;
}

export interface AnswerResult {
  question_id: string;
  given_index: number;
  correct_index: number;
  correct: boolean;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  total: number;
  results: AnswerResult[];
  created_at: string;
}

export async function listQuizzes(bookId: string): Promise<QuizSummary[]> {
  return api<QuizSummary[]>(`/books/${bookId}/quizzes`);
}

export async function createQuiz(
  bookId: string,
  questionCount = 8,
  translationId?: string | null,
): Promise<Quiz> {
  return api<Quiz>(`/books/${bookId}/quizzes`, {
    method: "POST",
    body: {
      question_count: questionCount,
      translation_id: translationId ?? null,
    },
  });
}

export async function getQuiz(quizId: string): Promise<Quiz> {
  return api<Quiz>(`/quizzes/${quizId}`);
}

export async function submitAttempt(
  quizId: string,
  answers: { question_id: string; answer_index: number }[],
): Promise<QuizAttempt> {
  return api<QuizAttempt>(`/quizzes/${quizId}/attempts`, {
    method: "POST",
    body: { answers },
  });
}
