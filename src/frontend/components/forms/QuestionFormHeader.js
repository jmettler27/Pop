import { DEFAULT_LOCALE } from "@/frontend/utils/locales";
import { prependQuestionTypeWithEmoji } from "@/backend/models/questions/QuestionType";

export default function QuestionFormHeader({ questionType, lang = DEFAULT_LOCALE }) {
    return <h1>{SUBMIT_QUESTION_LABEL[lang]} ({prependQuestionTypeWithEmoji(questionType, lang)})</h1>
}

const SUBMIT_QUESTION_LABEL = {
    'en': "Submit a question",
    'fr-FR': "Soumettre une question"
}