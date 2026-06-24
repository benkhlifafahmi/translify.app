import { api } from "./api";

export interface StudyExercise {
  id: string;
  question: string;
  hint: string;
}

export interface StudySection {
  id: string;
  title: string;
  /** Markdown notes. */
  summary: string;
  key_points: string[];
  exercises: StudyExercise[];
}

export interface StudyGuide {
  id: string;
  book_id: string;
  sections: StudySection[];
  created_at: string;
}

export interface GradeResult {
  exercise_id: string;
  correct: boolean;
  feedback: string;
  model_answer: string;
}

/** Throws ApiError(404) when no guide has been generated yet. */
export async function getStudyGuide(bookId: string): Promise<StudyGuide> {
  return api<StudyGuide>(`/books/${bookId}/study-guide`);
}

export async function generateStudyGuide(bookId: string): Promise<StudyGuide> {
  return api<StudyGuide>(`/books/${bookId}/study-guide`, {
    method: "POST",
    body: {},
  });
}

export async function gradeExercise(
  bookId: string,
  exerciseId: string,
  answer: string,
): Promise<GradeResult> {
  return api<GradeResult>(`/books/${bookId}/study-guide/grade`, {
    method: "POST",
    body: { exercise_id: exerciseId, answer },
  });
}
