'use server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import EditableQuestionService from '@/backend/services/question/EditableQuestionService';

/**
 * Full base question(s) for the in-game round editor, organizer-gated. Replaces the
 * client reading `questions/{id}` directly (production Firestore rules deny it). The
 * viewer is taken from the session, never a client argument.
 */
export const getEditableQuestion = async (gameId: string, questionId: string) => {
  const session = await getServerSession(authOptions);
  return EditableQuestionService.get(gameId, questionId, session?.user?.id);
};

export const getEditableQuestionTopics = async (gameId: string, questionIds: string[]) => {
  const session = await getServerSession(authOptions);
  return EditableQuestionService.getTopics(gameId, questionIds, session?.user?.id);
};
