import { QuestionType } from '@/backend/models/questions/QuestionType';

import * as Yup from 'yup';
import defineMessages from '@/utils/defineMessages';

export const questionTypeSchema = () =>
  Yup.string().oneOf(Object.values(QuestionType), 'Invalid type.').required('Required.');

export const messages = defineMessages('frontend.utils.questions', {
  questionTitle: 'Question',
  answer: 'Answer',
  submit: 'Submit',
  hintsRemarks: 'Hints / Remarks',
  item: 'Item',
  addItem: 'Add item',
  questionSource: 'To what work is this question related to?',
  explanation: 'Explanation',
  selectProposal: 'Select the proposal',
});
