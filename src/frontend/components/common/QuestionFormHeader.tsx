import { useIntl } from 'react-intl';

import type { Locale } from '@/frontend/helpers/locales';
import globalMessages from '@/frontend/i18n/globalMessages';
import type { QuestionType } from '@/models/questions/question-type';
import { prependQuestionTypeWithEmoji } from '@/models/questions/question-type';

interface QuestionFormHeaderProps {
  questionType: QuestionType;
}

export default function QuestionFormHeader({ questionType }: QuestionFormHeaderProps) {
  const intl = useIntl();
  return (
    <h1 className="text-lg sm:text-xl xl:text-3xl 2xl:text-4xl font-bold text-white mb-4 drop-shadow-lg">
      {intl.formatMessage(globalMessages.submitQuestion)} (
      {prependQuestionTypeWithEmoji(questionType, intl.locale as Locale)})
    </h1>
  );
}
