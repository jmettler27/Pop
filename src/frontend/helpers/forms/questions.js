import * as Yup from 'yup';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import globalMessages from '@/i18n/globalMessages';
import defineMessages from '@/utils/defineMessages';

export const questionTypeSchema = () =>
  Yup.string().oneOf(Object.values(QuestionType), 'Invalid type.').required('Required.');

const questionMessages = defineMessages('frontend.utils.questions', {
  hintsRemarks: 'Hints / Remarks',
  item: 'Item',
  addItem: 'Add item',
  questionSource: 'To what work is this question related to?',
  selectProposal: 'Select the proposal',
});

export const messages = {
  ...questionMessages,
  questionTitle: globalMessages.question,
  answer: globalMessages.answer,
  submit: globalMessages.submit,
  explanation: globalMessages.explanation,
};
