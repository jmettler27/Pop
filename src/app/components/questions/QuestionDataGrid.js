import { QUESTIONS_COLLECTION_REF, USERS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { query, where } from 'firebase/firestore';
import { useCollection, useCollectionOnce } from 'react-firebase-hooks/firestore';

import { timestampToDate } from '@/lib/utils/time';
import { localeToEmoji } from '@/lib/utils/locales';
import { topicToEmoji } from '@/lib/utils/topics';

import { BLINDTEST_TYPE_TO_TITLE } from '@/lib/utils/question/blindtest';
import { Avatar } from '@mui/material';
import LoadingScreen from '../LoadingScreen';
import { DataGrid } from '@mui/x-data-grid';

//
const progressiveCluesQuestionRow = (question) => {
    const { title, answer, clues } = question.details
    return {
        title,
        answer: answer.title,
        // clues: clues.join(', '),    // { field: 'clues', headerName: 'Clues', width: 130 },

    }
}
const progressiveCluesQuestionColumns = [
    { field: 'title', headerName: 'Question', width: 130 },
    { field: 'answer', headerName: 'Answer', width: 200 },
    // { field: 'clues', headerName: 'Clues', width: 130 },
]


//
const imageQuestionRow = (question) => {
    const { title, answer } = question.details
    return {
        title,
        answer,
    }
}
const imageQuestionColumns = [
    { field: 'title', headerName: 'Question', width: 250 },
    { field: 'answer', headerName: 'Answer', width: 500 },
]


//
const emojiQuestionRow = (question) => {
    const { title, answer, clue } = question.details
    return {
        title,
        answer: answer.title,
        clue,
    }
}
const emojiQuestionColumns = [
    { field: 'title', headerName: 'Question', width: 200 },
    { field: 'answer', headerName: 'Answer', width: 300 },
    { field: 'clue', headerName: 'Clue', width: 130 },
]


//
const blindtestQuestionRow = (question) => {
    const { subtype, title, answer } = question.details
    return {
        subtype: BLINDTEST_TYPE_TO_TITLE[question.lang][subtype],
        title,
        answer_source: answer.source,
        answer_author: answer.author,
        answer_title: answer.title,
    }
}
const blindtestQuestionColumns = [
    { field: 'subtype', headerName: 'Type', width: 130 },
    { field: 'title', headerName: 'Question', width: 200 },
    { field: 'answer_source', headerName: 'Source', width: 200 },
    { field: 'answer_author', headerName: 'Author', width: 200 },
    { field: 'answer_title', headerName: 'Title', width: 200 },
]


//
const enumQuestionRow = (question) => {
    const { title, note, answer, maxIsKnown, thinkingTime, challengeTime } = question.details
    return {
        title,
        note: note,
        numAnswers: maxIsKnown ? answer.length : ">= " + answer.length,
        thinkingTime,
        challengeTime
    }
}
const enumQuestionColumns = [
    { field: 'title', headerName: 'Question', width: 450 },
    { field: 'note', headerName: 'Note', width: 200 },
    { field: 'numAnswers', headerName: '# of answers', width: 130 },
    { field: 'thinkingTime', headerName: 'Thinking (s)', width: 100 },
    { field: 'challengeTime', headerName: 'Challenge (s)', width: 100 },
]


//
const oddOneOutQuestionRow = (question) => {
    const { answerIdx, items, title } = question.details
    return {
        title,
        oddOneOut: items[answerIdx].title,
    }
}
const oddOneOutQuestionColumns = [
    { field: 'title', headerName: 'Question', width: 450 },
    { field: 'oddOneOut', headerName: 'Odd one out', width: 450 },
]


//
const matchingQuestionRow = (question) => {
    const { title, numCols, numRows } = question.details
    return {
        title,
        numCols,
        numRows,
    }
}
const matchingQuestionColumns = [
    { field: 'title', headerName: 'Question', width: 500 },
    { field: 'numCols', headerName: 'Columns', width: 100 },
    { field: 'numRows', headerName: 'Matches', width: 100 },
]


//
const quoteQuestionRow = (question) => {
    const { author, quote, source, toGuess } = question.details
    return {
        author,
        quote: `"${quote}"`,
        source,
        toGuess: toGuess.join(', '),
    }
}
const quoteQuestionColumns = [
    { field: 'source', headerName: 'Source', width: 200 },
    { field: 'author', headerName: 'Author', width: 200 },
    { field: 'quote', headerName: 'Quote', width: 500 },
    { field: 'toGuess', headerName: 'To guess', width: 200 },
]


const mcqQuestionRow = (question) => {
    const { answerIdx, choices, explanation, note, source, title } = question.details
    return {
        answer: choices[answerIdx],
        // explanation,
        // note,
        source,
        title,
    }
}
const mcqQuestionColumns = [
    { field: 'source', headerName: 'Source', width: 250 },
    { field: 'title', headerName: 'Question', width: 500 },
    // { field: 'note', headerName: 'Note', width: MCQ_NOTE_MAX_LENGTH * 6 },
    { field: 'answer', headerName: 'Answer', width: 400 },
    // { field: 'explanation', headerName: 'Explanation', width: 130 },
]


const questionTypeToRow = {
    'progressive_clues': progressiveCluesQuestionRow,
    'image': imageQuestionRow,
    'emoji': emojiQuestionRow,
    'blindtest': blindtestQuestionRow,
    'enum': enumQuestionRow,
    'odd_one_out': oddOneOutQuestionRow,
    'matching': matchingQuestionRow,
    'quote': quoteQuestionRow,
    'mcq': mcqQuestionRow,
}

const questionTypeToColumns = {
    'progressive_clues': progressiveCluesQuestionColumns,
    'image': imageQuestionColumns,
    'emoji': emojiQuestionColumns,
    'blindtest': blindtestQuestionColumns,
    'enum': enumQuestionColumns,
    'odd_one_out': oddOneOutQuestionColumns,
    'matching': matchingQuestionColumns,
    'quote': quoteQuestionColumns,
    'mcq': mcqQuestionColumns,
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
        createdAt: timestampToDate(createdAt, lang),
        createdBy: {
            name,
            image,
        },
    }
}

const questionColumns = (questionType) => {
    return [
        { field: 'id', headerName: "ID", width: 100 },
        { field: 'lang', headerName: "Lang", width: 50 },
        { field: 'topic', headerName: "Topic", width: 75 },
        ...questionTypeToColumns[questionType],
        { field: 'createdAt', headerName: "Created at", width: 130 },
        {
            field: 'createdBy', headerName: "Created by", width: 130,
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
    const [usersCollection, usersLoading, usersError] = useCollectionOnce(USERS_COLLECTION_REF)
    const q = query(QUESTIONS_COLLECTION_REF, where('type', '==', questionType), where('approved', '==', true));
    const [questionsCollection, questionsLoading, questionsError] = useCollection(q)
    if (usersError) {
        return <p><strong>Error: {JSON.stringify(usersError)}</strong></p>
    }
    if (questionsError) {
        return <p><strong>Error: {JSON.stringify(questionsError)}</strong></p>
    }
    if (usersLoading || questionsLoading) {
        return <LoadingScreen loadingText="Loading questions and users..." />
    }
    if (!usersCollection || !questionsCollection) {
        return <></>
    }
    const users = usersCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }))
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