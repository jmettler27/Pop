import { type MessageDescriptor } from 'react-intl';
import * as Yup from 'yup';

import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { QuestionType } from '@/models/questions/question-type';

export const questionTypeSchema = () =>
  Yup.string().oneOf(Object.values(QuestionType), 'Invalid type.').required('Required.');

const questionMessages = defineMessages('frontend.utils.questions', {
  hintsRemarks: 'Hints / Remarks',
  item: 'Item',
  addItem: 'Add item',
  questionSource: 'To what work is this question related to?',
  selectProposal: 'Select the proposal',
});

export const messages: Record<string, MessageDescriptor> = {
  ...questionMessages,
  questionTitle: globalMessages.question,
  answer: globalMessages.answer,
  submit: globalMessages.submit,
  explanation: globalMessages.explanation,
};
