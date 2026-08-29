import { Timestamp } from 'firebase-admin/firestore';

import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import { type QuestionType } from '@/models/questions/question-type';

export interface QuestionBankPage {
  /** Raw question docs (Firestore shape), `createdAt` serialized to `{ seconds, nanoseconds }`. */
  items: Array<Record<string, unknown>>;
  hasMore: boolean;
}

function serializeTimestamps(doc: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    out[key] = value instanceof Timestamp ? { seconds: value.seconds, nanoseconds: value.nanoseconds } : value;
  }
  return out;
}

/**
 * Read-only access to the approved question bank for the organizer-only search table.
 * The client used to `query(questions, …)` directly; production Firestore rules now
 * deny `list` on `questions`, so this goes through the admin SDK instead.
 */
export default class QuestionBankService {
  static async listApproved(
    questionType: QuestionType,
    pageSize: number,
    pageIndex: number
  ): Promise<QuestionBankPage> {
    const repo = new BaseQuestionRepository(questionType);
    // Over-fetch one to detect a further page without a second query.
    const docs = await repo.listApproved(pageSize + 1, Math.max(0, pageIndex) * pageSize);
    return {
      items: docs.slice(0, pageSize).map(serializeTimestamps),
      hasMore: docs.length > pageSize,
    };
  }

  static async countApproved(questionType: QuestionType): Promise<number> {
    return new BaseQuestionRepository(questionType).countApproved();
  }
}
