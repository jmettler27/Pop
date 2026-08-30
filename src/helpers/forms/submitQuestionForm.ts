import { addRoundQuestion, createQuestion, updateQuestion } from '@/api';
import { type Locale } from '@/helpers/locales';
import { type QuestionType } from '@/models/questions/question-type';
import { type Topic } from '@/models/topic';

/** The `{ type, topic, lang, details }` payload every question form assembles from its fields. */
export interface QuestionFormPayload {
  type: QuestionType;
  topic: Topic;
  lang: Locale;
  details: Record<string, unknown>;
}

export interface SubmitQuestionFormOptions {
  /** Id of the question being edited; omit to create a new one. */
  editId?: string;
  /** New image / audio to upload (falsy entries are skipped). */
  files?: { image?: File | null; audio?: File | null };
  /** When creating inside the game editor, the round to append the new question to. */
  round?: { gameId: string; roundId: string };
}

function toFormData(payload: QuestionFormPayload, files?: SubmitQuestionFormOptions['files']): FormData {
  const form = new FormData();
  form.append('data', JSON.stringify(payload));
  if (files?.image) form.append('image', files.image);
  if (files?.audio) form.append('audio', files.audio);
  return form;
}

/**
 * Create or edit a bank question through the Go API (`POST` / `PUT /questions`,
 * `multipart/form-data`), then — on create, in the game editor — add it to the
 * round. Replaces the `submitQuestion` / `editQuestion` + `addQuestionToRound`
 * server-action trio the question forms used to call; `createdBy` / `approved`
 * are set server-side from the token now, so no `userId` argument.
 */
export async function submitQuestionForm(
  payload: QuestionFormPayload,
  options: SubmitQuestionFormOptions = {}
): Promise<string> {
  const form = toFormData(payload, options.files);

  if (options.editId) {
    const { id } = await updateQuestion(options.editId, form);
    return id;
  }

  const { id } = await createQuestion(form);
  if (options.round) {
    await addRoundQuestion(options.round.gameId, options.round.roundId, { questionId: id });
  }
  return id;
}
