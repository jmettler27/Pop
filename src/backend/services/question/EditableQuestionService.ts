import { Timestamp } from 'firebase-admin/firestore';

import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import { QuestionType } from '@/models/questions/question-type';

function serializeTimestamps(doc: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    out[key] = value instanceof Timestamp ? { seconds: value.seconds, nanoseconds: value.nanoseconds } : value;
  }
  return out;
}

async function assertOrganizer(gameId: string, viewerId: string | undefined): Promise<void> {
  if (!viewerId) throw new Error('Not authorized to read this question');
  const organizer = await new OrganizerRepository(gameId).getOrganizer(viewerId);
  if (!organizer) throw new Error('Not authorized to read this question');
}

// `BaseQuestionRepository.get` is a raw `questions/{id}` doc read — the type arg only
// matters for `getQuestion` / bank queries, so any value works here.
const questionsRepo = () => new BaseQuestionRepository(QuestionType.BASIC);

/**
 * Full `questions/{id}` docs for the in-game round editor. Organizer-gated: production
 * Firestore rules deny the client reading `questions/{id}` directly, and these carry the
 * unredacted answers, so the caller must organize the game. Fetched a whole round at a
 * time (one auth check, one round-trip) — the editor renders every question at once.
 */
export default class EditableQuestionService {
  static async getMany(
    gameId: string,
    questionIds: string[],
    viewerId: string | undefined
  ): Promise<Record<string, Record<string, unknown>>> {
    await assertOrganizer(gameId, viewerId);
    const docs = await Promise.all(questionIds.map((id) => questionsRepo().get(id)));
    const out: Record<string, Record<string, unknown>> = {};
    questionIds.forEach((id, i) => {
      const doc = docs[i];
      if (doc) out[id] = serializeTimestamps(doc);
    });
    return out;
  }
}
