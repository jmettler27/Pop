import { questionTypeToTitle } from "@/lib/utils/question_types";

export default function QuestionFormHeader({ questionType }) {
    return <h1>Submit a question: {questionTypeToTitle(questionType)}</h1>
}