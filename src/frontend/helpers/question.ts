type EmojiElement =
  'source' | 'author' | 'answer' | 'topic' | 'title' | 'createdAt' | 'createdBy' | 'note' | 'description';

export const QUESTION_ELEMENT_TO_EMOJI: Partial<Record<EmojiElement, string>> = {
  source: '📜',
  author: '🧑',
  description: '📝',
  note: '⚠️',
};
