'use server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import EditableQuestionService from '@/backend/services/question/EditableQuestionService';

/**
 * Full base question docs for the in-game round editor, keyed by id, organizer-gated.
 * Replaces the client reading `questions/{id}` directly (production Firestore rules deny
 * it). The viewer is taken from the session, never a client argument.
 */
export const getEditableQuestions = async (gameId: string, questionIds: string[]) => {
  const session = await getServerSession(authOptions);
  return EditableQuestionService.getMany(gameId, questionIds, session?.user?.id);
};
