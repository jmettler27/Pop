import { ANSWER_TEXT, CORRECT_ANSWER_TEXT, INCORRECT_ANSWER_TEXT } from "@/lib/utils/question/question"

export default function MCQFooter({ question, realtime, lang = 'en' }) {

    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <span className="text-4xl">{realtime.correct !== null && <MCQPlayerAnswerText realtime={realtime} lang={lang} />} {ANSWER_TEXT[lang]}: <span className='font-bold text-green-500'>{question.details.choices[question.details.answerIdx]}</span></span>
            {question.details.explanation && <span className='text-2xl'>{question.details.explanation}</span>}
        </div>
    )
}

function MCQPlayerAnswerText({ realtime, lang = 'en' }) {
    if (realtime.correct) {
        return <span className="text-green-500">{CORRECT_ANSWER_TEXT[lang]}</span>
    }
    return <span className="text-red-500">{INCORRECT_ANSWER_TEXT[lang]}</span>
}