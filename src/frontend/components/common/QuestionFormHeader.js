import { useIntl } from 'react-intl';

import globalMessages from '@/frontend/i18n/globalMessages';
import { prependQuestionTypeWithEmoji } from '@/models/questions/QuestionType';

export default function QuestionFormHeader({ questionType }) {
  const intl = useIntl();
  return (
    <h1 className="text-lg sm:text-xl xl:text-3xl 2xl:text-4xl font-bold text-white mb-4 drop-shadow-lg">
      {intl.formatMessage(globalMessages.submitQuestion)} ({prependQuestionTypeWithEmoji(questionType, intl.locale)})
    </h1>
  );
}
