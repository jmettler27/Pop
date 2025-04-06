import { timestampToDate, timestampToDate1 } from '@/backend/utils/time';
import { QUESTION_ELEMENT_TO_TITLE, ANSWER_TEXT } from '@/backend/utils/question/question';

import { BlindtestQuestion } from '@/backend/models/questions/Blindtest';
import { QuoteQuestion, QuotePartElement, QuoteAuthorElement, QuoteSourceElement } from '@/backend/models/questions/Quote';
import { topicToEmoji } from '@/backend/models/Topic';

import { QUESTIONS_COLLECTION_REF, USERS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { query, where } from 'firebase/firestore';
import { useCollection, useCollectionOnce } from 'react-firebase-hooks/firestore';


import LoadingScreen from '@/frontend/components/LoadingScreen';

import { DEFAULT_LOCALE, localeToEmoji } from '@/frontend/utils/locales';

import { Avatar } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';


const CLUE = {
    'en': "Clue",
    'fr-FR': "Indice"
}


const TITLE = {
    'en': "Title",
    'fr-FR': "Titre"
}

// PROGRESSIVE CLUES
const progressiveCluesQuestionRow = (question) => {
    const { title, answer, clues } = question.details
    return {
        title,
        answer: answer.title,

    }
}
const progressiveCluesQuestionColumns = [
    { field: 'title', headerName: 'Question', width: 150 },
    { field: 'answer', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['answer'], width: 250 },
]

// IMAGE
const imageQuestionRow = (question) => {
    const { title, answer: { description, source } } = question.details
    return {
        title,
        description,
        source,
    }
}
const imageQuestionColumns = [
    { field: 'title', headerName: 'Question', width: 250 },
    { field: 'description', headerName: 'Description', width: 250 },
    { field: 'source', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['source'], width: 250 }
]

// EMOJI
const emojiQuestionRow = (question) => {
    const { title, answer, clue } = question.details
    return {
        title,
        answer: answer.title,
        clue,
    }
}
const emojiQuestionColumns = [
    { field: 'title', headerName: 'Question', width: 225 },
    { field: 'answer', headerName: ANSWER_TEXT[DEFAULT_LOCALE], width: 225 },
    { field: 'clue', headerName: CLUE[DEFAULT_LOCALE], width: 200 },
]

// BLINDTEST
const blindtestQuestionRow = (question) => {
    const { subtype, title, answer } = question.details
    return {
        subtype: BlindtestQuestion.typeToEmoji(subtype),
        title,
        answer_source: answer.source,
        answer_author: answer.author,
        answer_title: answer.title,
    }
}
const blindtestQuestionColumns = [
    { field: 'subtype', headerName: 'Type', width: 100 },
    { field: 'title', headerName: 'Question', width: 150 },
    { field: 'answer_source', headerName: QuoteSourceElement.elementToTitle(), width: 200 },
    { field: 'answer_author', headerName: QuoteAuthorElement.elementToTitle(), width: 200 },
    { field: 'answer_title', headerName: TITLE[DEFAULT_LOCALE], width: 200 },
]

// ENUM
const enumQuestionRow = (question) => {
    const { title, note, answer, maxIsKnown, thinkingTime, challengeTime } = question.details
    return {
        title,
        note,
        numAnswers: maxIsKnown ? answer.length : ">= " + answer.length,
        thinkingTime,
        challengeTime
    }
}
const ENUM_NUM_ANSWERS = {
    'en': "Answers",
    'fr-FR': "Réponses"
}
const ENUM_THINKING = {
    'en': "Thinking (s)",
    'fr-FR': "Réflexion (s)"
}
const enumQuestionColumns = [
    { field: 'title', headerName: 'Question', width: 400 },
    { field: 'note', headerName: 'Note', width: 250 },
    { field: 'numAnswers', headerName: ENUM_NUM_ANSWERS[DEFAULT_LOCALE], width: 100 },
    { field: 'thinkingTime', headerName: ENUM_THINKING[DEFAULT_LOCALE], width: 100 },
    { field: 'challengeTime', headerName: 'Challenge (s)', width: 100 },
]

// ODD ONE OUT
const oddOneOutQuestionRow = (question) => {
    const { answerIdx, items, title } = question.details
    return {
        title,
        oddOneOut: items[answerIdx].title,
    }
}
const ODD_ONE_OUT = {
    'en': "Odd one out",
    'fr-FR': "Intrus"
}
const oddOneOutQuestionColumns = [
    { field: 'title', headerName: 'Question', width: 500 },
    { field: 'oddOneOut', headerName: ODD_ONE_OUT[DEFAULT_LOCALE], width: 250 },
]

// MATCHING
const matchingQuestionRow = (question) => {
    const { title, numCols, numRows } = question.details
    return {
        title,
        numCols,
        numRows,
    }
}
const MATCHING_COLUMNS = {
    'en': "Columns",
    'fr-FR': "Colonnes"
}
const matchingQuestionColumns = [
    { field: 'title', headerName: 'Question', width: 500 },
    { field: 'numCols', headerName: MATCHING_COLUMNS[DEFAULT_LOCALE], width: 100 },
    { field: 'numRows', headerName: 'Matches', width: 100 },
]

// QUOTE
const quoteQuestionRow = (question) => {
    const { author, quote, source, toGuess } = question.details

    const sortedToGuess = toGuess.sort((a, b) => {
        return QuoteQuestion.ELEMENTS_SORT_ORDER.indexOf(a) - QuoteQuestion.ELEMENTS_SORT_ORDER.indexOf(b);
    });
    const toGuessWithEmojis = sortedToGuess.map((item) => QuoteQuestion.elementToEmoji(item)).join(', ');

    return {
        author,
        quote: `"${quote}"`,
        source,
        toGuess: toGuessWithEmojis
    }
}
const QUOTE = {
    'en': "Quote",
    'fr-FR': "Réplique"
}
const QUOTE_TO_GUESS = {
    'en': "To guess",
    'fr-FR': "À deviner"
}
const quoteQuestionColumns = [
    { field: 'source', headerName: QuoteSourceElement.elementToTitle(), width: 200 },
    { field: 'author', headerName: QuoteAuthorElement.elementToTitle(), width: 200 },
    { field: 'quote', headerName: QUOTE[DEFAULT_LOCALE], width: 500 },
    { field: 'toGuess', headerName: QUOTE_TO_GUESS[DEFAULT_LOCALE], width: 100 },
]

// LABEL
const labelQuestionRow = (question) => {
    const { title, labels } = question.details

    return {
        numLabels: labels.length,
        title,
    }
}

const NUM_LABELS = {
    'en': "Labels",
    'fr-FR': "Étiquettes"
}

const labelQuestionColumns = [
    { field: 'numLabels', headerName: NUM_LABELS[DEFAULT_LOCALE], width: 100 },
    { field: 'title', headerName: 'Question', width: 400 },
]


// ODD ONE OUT
const reorderingQuestionRow = (question) => {
    const { answerIdx, items, title } = question.details
    return {
        title,
    }
}
const reorderingQuestionColumns = [
    { field: 'title', headerName: 'Question', width: 500 },
]

// MCQ
const mcqQuestionRow = (question) => {
    const { answerIdx, choices, explanation, note, source, title } = question.details
    return {
        numChoices: choices.length,
        answer: choices[answerIdx],
        // explanation,
        // note,
        source,
        title,
    }
}

const NUM_CHOICES = {
    'en': "Choices",
    'fr-FR': "Choix"
}

const mcqQuestionColumns = [
    { field: 'numChoices', headerName: NUM_CHOICES[DEFAULT_LOCALE], width: 75 },
    { field: 'source', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['source'], width: 200 },
    { field: 'title', headerName: 'Question', width: 500 },
    // { field: 'note', headerName: 'Note', width: MCQ_NOTE_MAX_LENGTH * 6 },
    { field: 'answer', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['answer'], width: 250 },
    // { field: 'explanation', headerName: 'Explanation', width: 130 },
]


// NAGUI
const naguiQuestionRow = (question) => {
    const { answerIdx, choices, explanation, note, source, title } = question.details
    return {
        answer: choices[answerIdx],
        // explanation,
        // note,
        source,
        title,
    }
}
const naguiQuestionColumns = [
    { field: 'source', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['source'], width: 200 },
    { field: 'title', headerName: 'Question', width: 500 },
    // { field: 'note', headerName: 'Note', width: NAGUI_NOTE_MAX_LENGTH * 6 },
    { field: 'answer', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['answer'], width: 250 },
    // { field: 'explanation', headerName: 'Explanation', width: 130 },
]


// BASIC
const basicQuestionRow = (question) => {
    const { answer, explanation, note, source, title } = question.details
    return {
        answer,
        // explanation,
        // note,
        source,
        title,
    }
}
const basicQuestionColumns = [
    { field: 'source', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['source'], width: 200 },
    { field: 'title', headerName: 'Question', width: 500 },
    // { field: 'note', headerName: 'Note', width: MCQ_NOTE_MAX_LENGTH * 6 },
    { field: 'answer', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['answer'], width: 250 },
    // { field: 'explanation', headerName: 'Explanation', width: 130 },
]


import { QuestionType } from '@/backend/models/questions/QuestionType';
import UserRepository from '@/backend/repositories/user/UserRepository';

const questionTypeToRow = {
    [QuestionType.PROGRESSIVE_CLUES]: progressiveCluesQuestionRow,
    [QuestionType.IMAGE]: imageQuestionRow,
    [QuestionType.EMOJI]: emojiQuestionRow,
    [QuestionType.BLINDTEST]: blindtestQuestionRow,
    [QuestionType.ENUMERATION]: enumQuestionRow,
    [QuestionType.ODD_ONE_OUT]: oddOneOutQuestionRow,
    [QuestionType.MATCHING]: matchingQuestionRow,
    [QuestionType.QUOTE]: quoteQuestionRow,
    [QuestionType.LABELLING]: labelQuestionRow,
    [QuestionType.REORDERING]: reorderingQuestionRow,
    [QuestionType.MCQ]: mcqQuestionRow,
    [QuestionType.NAGUI]: naguiQuestionRow,
    [QuestionType.BASIC]: basicQuestionRow
}

const questionTypeToColumns = {
    [QuestionType.PROGRESSIVE_CLUES]: progressiveCluesQuestionColumns,
    [QuestionType.IMAGE]: imageQuestionColumns,
    [QuestionType.EMOJI]: emojiQuestionColumns,
    [QuestionType.BLINDTEST]: blindtestQuestionColumns,
    [QuestionType.ENUMERATION]: enumQuestionColumns,
    [QuestionType.ODD_ONE_OUT]: oddOneOutQuestionColumns,
    [QuestionType.MATCHING]: matchingQuestionColumns,
    [QuestionType.QUOTE]: quoteQuestionColumns,
    [QuestionType.LABELLING]: labelQuestionColumns,
    [QuestionType.REORDERING]: reorderingQuestionColumns,
    [QuestionType.MCQ]: mcqQuestionColumns,
    [QuestionType.NAGUI]: naguiQuestionColumns,
    [QuestionType.BASIC]: basicQuestionColumns
}

const commonQuestionRow = (question, users) => {
    const { id, lang, topic, type, createdAt, createdBy } = question

    const user = users.find((user) => user.id === createdBy)
    const { name, image } = user

    return {
        id,
        lang: localeToEmoji(lang),
        topic: topicToEmoji(topic),
        // type: prependQuestionTypeWithEmoji(type, lang),
        createdAt: timestampToDate1(createdAt, lang),
        createdBy: {
            name,
            image,
        },
    }
}

const questionColumns = (questionType, lang = DEFAULT_LOCALE) => {
    return [
        { field: 'id', headerName: "ID", width: 100 },
        { field: 'lang', headerName: "Lang", width: 50 },
        { field: 'topic', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['topic'], width: 75 },
        ...questionTypeToColumns[questionType],
        { field: 'createdAt', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['createdAt'], width: 130 },
        {
            field: 'createdBy', headerName: QUESTION_ELEMENT_TO_TITLE[DEFAULT_LOCALE]['createdBy'], width: 130,
            renderCell: (params) => (
                <div className='flex flex-row w-full space-x-2 items-center'>
                    <Avatar src={params.row.createdBy.image} variant='rounded' sx={{ width: 30, height: 30 }} />
                    <span>{params.row.createdBy.name}</span>
                </div>
            )
        },
    ]
}

const questionRow = (question, users) => {
    const commonInfo = commonQuestionRow(question, users)
    const typeSpecificInfo = questionTypeToRow[question.type](question)
    return { ...commonInfo, ...typeSpecificInfo }
}

export function SearchQuestionDataGrid({ questionType, questionSelectionModel = [], onQuestionSelectionModelChange = () => { } }) {
    const userRepo = new UserRepository()
    const { users, loading: usersLoading, error: usersError } = userRepo.useAllUsersOnce()

    const q = query(QUESTIONS_COLLECTION_REF, where('type', '==', questionType), where('approved', '==', true));
    const [questionsCollection, questionsLoading, questionsError] = useCollectionOnce(q)
    if (usersError) {
        return <p><strong>Error: {JSON.stringify(usersError)}</strong></p>
    }
    if (questionsError) {
        return <p><strong>Error: {JSON.stringify(questionsError)}</strong></p>
    }
    if (usersLoading || questionsLoading) {
        return <LoadingScreen loadingText="Loading questions and users..." />
    }
    if (!users || !questionsCollection) {
        return <></>
    }
    const questions = questionsCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const rows = questions.map(question => questionRow(question, users))
    const columns = questionColumns(questionType)

    return (
        <div className='h-full overflow-y-auto flex flex-col'>
            <DataGrid rows={rows} columns={columns}
                onRowSelectionModelChange={onQuestionSelectionModelChange}
                rowSelectionModel={questionSelectionModel}
            />
        </div>
    )
}