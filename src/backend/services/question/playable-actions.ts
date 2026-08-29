'use server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import PlayableQuestionService from '@/backend/services/question/PlayableQuestionService';
import { type QuestionType } from '@/models/questions/question-type';

/**
 * The base question for an in-game client, with answer-bearing fields redacted for
 * players/spectators until the question ends. The viewer is taken from the session
 * (organizers get the full question), never from a client-supplied argument.
 */
export const getPlayableQuestion = async (
  gameId: string,
  roundId: string,
  questionType: QuestionType,
  questionId: string
) => {
  const session = await getServerSession(authOptions);
  return PlayableQuestionService.get(gameId, roundId, questionType, questionId, session?.user?.id);
};
