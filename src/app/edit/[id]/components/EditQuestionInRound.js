import { useParams } from 'next/navigation'

import React from 'react';
import { useState } from 'react'

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore';
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'


import { Button, Divider } from '@mui/material';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete';

import { CardTitle, CardHeader, CardContent, Card } from '@/app/components/card'
import { QuestionCardHeader, QuestionCardMainContent } from '@/app/components/questions/QuestionCard';

import { useAsyncAction } from '@/lib/utils/async'
import { DIALOG_ACTION_CANCEL, DIALOG_WARNING } from '@/lib/utils/dialogs'
import { removeQuestionFromRound } from '@/app/edit/[id]/lib/edit-game'



export function EditQuestionCard({ roundId, questionId, questionOrder }) {
    const { id: gameId } = useParams()

    const questionDocRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    const [questionData, questionDataLoading, questionDataError] = useDocumentDataOnce(questionDocRef)
    const [realtimeData, realtimeDataLoading, realtimeDataError] = useDocumentData(realtimeDocRef)
    if (questionDataError) {
        return <div>Error...</div>
    }
    if (realtimeDataError) {
        return <div>Error...</div>
    }
    if (questionDataLoading || realtimeDataLoading) {
        return <div>Loading...</div>
    }
    if (!questionData || !realtimeData) {
        return <div>No data...</div>
    }

    return (
        <Card variant='outlined w-full'>
            <CardContent className='flex flex-col justify-center items-center w-full'>
                <QuestionCardHeader question={questionData} />
                <QuestionCardMainContent question={questionData} />
                <div className='text-sm'>#{questionOrder + 1}</div>

                <Divider className='my-2 bg-slate-600 dark:bg-slate-200' />
                <RemoveQuestionFromRoundButton roundId={roundId} questionId={questionId} className='self-center' />
            </CardContent>
        </Card>
    );
}

function RemoveQuestionFromRoundButton({ roundId, questionId, lang = 'en' }) {
    const { id: gameId } = useParams()

    const [dialogOpen, setDialogOpen] = useState(false)

    const [handleRemoveQuestion, isRemoving] = useAsyncAction(async () => {
        await removeQuestionFromRound(gameId, roundId, questionId)
    })

    const onCancel = () => {
        setDialogOpen(false)
    }

    const onDialogClose = () => {
        setDialogOpen(false)
    }

    return (
        <>
            <IconButton
                color='error'
                onClick={() => setDialogOpen(true)}
                disabled={isRemoving}
            >
                <DeleteIcon />
            </IconButton>

            <Dialog disableEscapeKeyDown open={dialogOpen} onClose={onDialogClose}>
                <DialogTitle>{REMOVE_QUESTION_FROM_ROUND_DIALOG_TITLE[lang]}</DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        {DIALOG_WARNING[lang]}
                    </DialogContentText>
                </DialogContent>

                <DialogActions>
                    <Button
                        variant='contained'
                        color='primary'
                        onClick={handleRemoveQuestion}
                        disabled={isRemoving}
                    >
                        {REMOVE_QUESTION_FROM_ROUND_DIALOG_ACTION_VALIDATE[lang]}
                    </Button>

                    <Button
                        variant='outlined'
                        color='error'
                        onClick={onCancel}
                    >
                        {DIALOG_ACTION_CANCEL[lang]}
                    </Button>
                </DialogActions>

            </Dialog>
        </>
    )
}


const REMOVE_QUESTION_FROM_ROUND_DIALOG_TITLE = {
    'en': "Are you sure you want to remove this question?",
    'fr-FR': "T'es sûr de vouloir supprimer cette question ?"
}

const REMOVE_QUESTION_FROM_ROUND_DIALOG_ACTION_VALIDATE = {
    'en': "Yes",
    'fr-FR': "Oui"
}
