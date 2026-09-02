import React, { createContext, useMemo } from 'react';

import { type QuestionType } from '@/models/questions/question-type';

export interface ActiveQuestionData {
  gameId: string;
  roundId: string;
  questionId: string;
  questionType: QuestionType;
}

export const ActiveQuestionContext = createContext<ActiveQuestionData | null>(null);

interface ActiveQuestionProviderProps extends ActiveQuestionData {
  children: React.ReactNode;
}

// Value is memoized on the primitive fields only, so it keeps its identity across
// re-renders where only game.status changes (e.g. QUESTION_ACTIVE <-> QUESTION_END) -
// these fields never change while status stays within that pair.
export const ActiveQuestionProvider = ({
  children,
  gameId,
  roundId,
  questionId,
  questionType,
}: ActiveQuestionProviderProps) => {
  const value = useMemo(
    () => ({ gameId, roundId, questionId, questionType }),
    [gameId, roundId, questionId, questionType]
  );

  return <ActiveQuestionContext.Provider value={value}>{children}</ActiveQuestionContext.Provider>;
};
