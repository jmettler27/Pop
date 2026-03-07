import { prependQuestionTypeWithEmoji } from '@/backend/models/questions/QuestionType';
import globalMessages from '@/i18n/globalMessages';

import { useIntl } from 'react-intl';

export default function QuestionFormHeader({ questionType }) {
  const intl = useIntl();
  return (
    <h1 className="text-lg sm:text-xl xl:text-3xl 2xl:text-4xl font-bold text-white mb-4 drop-shadow-lg">
      {intl.formatMessage(globalMessages.submitQuestion)} ({prependQuestionTypeWithEmoji(questionType, intl.locale)})
    </h1>
  );
}
