import { QuestionType } from '@/backend/models/questions/QuestionType'

import * as Yup from 'yup'

export const questionTypeSchema = () => Yup.string()
    .oneOf(Object.values(QuestionType), "Invalid type.")
    .required("Required.")


export const QUESTION_TITLE_LABEL = {
    'en': "Question",
    'fr-FR': "Question"
}

export const QUESTION_ANSWER_LABEL = {
    'en': "Answer",
    'fr-FR': "Réponse"
}

export const SUBMIT_QUESTION_BUTTON_LABEL = {
    'en': "Submit",
    'fr-FR': "Soumettre"
}

export const QUESTION_HINTS_REMARKS = {
    'en': "Hints / Remarks",
    'fr-FR': "Indices / Remarques"
}

export const QUESTION_ITEM = {
    'en': "Item",
    'fr-FR': "Élément"
}

export const ADD_ITEM = {
    'en': "Add item",
    'fr-FR': "Ajouter élément"
}

export const QUESTION_SOURCE_LABEL = {
    'en': "To what work is this question related to?",
    'fr-FR': "À quel oeuvre cette question est-elle liée ?"
}

export const QUESTION_EXPLANATION_LABEL = {
    'en': "Explanation",
    'fr-FR': "Explication"
}

export const SELECT_PROPOSAL = {
    'en': "Select the proposal",
    'fr-FR': "Sélectionnez la proposition"
}
