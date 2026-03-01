import { prependQuestionTypeWithEmoji } from '@/backend/models/questions/QuestionType';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.forms.QuestionFormHeader', {
  submitQuestion: 'Submit a question',
});

export default function QuestionFormHeader({ questionType }) {
  const intl = useIntl();
  return (
    <h1 className="text-lg sm:text-xl xl:text-3xl 2xl:text-4xl font-bold text-white mb-4 drop-shadow-lg">
      {intl.formatMessage(messages.submitQuestion)} ({prependQuestionTypeWithEmoji(questionType, intl.locale)})
    </h1>
  );
}
