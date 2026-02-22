import { DEFAULT_LOCALE } from '@/frontend/utils/locales';
import { prependQuestionTypeWithEmoji } from '@/backend/models/questions/QuestionType';

export default function QuestionFormHeader({ questionType, lang = DEFAULT_LOCALE }) {
  return (
    <h1 className="text-lg sm:text-xl xl:text-3xl 2xl:text-4xl font-bold text-white mb-4 drop-shadow-lg">
      {SUBMIT_QUESTION_LABEL[lang]} ({prependQuestionTypeWithEmoji(questionType, lang)})
    </h1>
  );
}

const SUBMIT_QUESTION_LABEL = {
  en: 'Submit a question',
  'fr-FR': 'Soumettre une question',
};
