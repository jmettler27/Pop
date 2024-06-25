import { useParams } from 'next/navigation'

import React from 'react';
import { useState } from 'react'

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore';
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'


import { Avatar, Button, Divider } from '@mui/material';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete';

import { CardTitle, CardHeader, CardContent, Card, CardFooter } from '@/app/components/card'
import { QuestionCardTitle, QuestionCardContent } from '@/app/components/questions/QuestionCard';

import { useAsyncAction } from '@/lib/utils/async'
import { DIALOG_ACTION_CANCEL, DIALOG_WARNING } from '@/lib/utils/dialogs'
import { DEFAULT_LOCALE } from '@/lib/utils/locales';

import { removeQuestionFromRound, updateQuestionCreator } from '@/app/edit/[id]/lib/edit-game'



export function EditQuestionCard({ roundId, questionId, questionOrder }) {
    const { id: gameId } = useParams()

    const questionDocRef = doc(QUESTIONS_COLLECTION_REF, questionId)
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId)

    const [questionData, questionDataLoading, questionDataError] = useDocumentDataOnce(questionDocRef)
    const [realtimeData, realtimeDataLoading, realtimeDataError] = useDocumentData(realtimeDocRef)
    if (questionDataError) {
        return <span>Error: {JSON.stringify(questionDataError)}</span>
    }
    if (realtimeDataError) {
        return <span>Error: {JSON.stringify(realtimeDataError)}</span>
    }
    if (questionDataLoading || realtimeDataLoading) {
        return <div>Loading...</div>
    }
    if (!questionData || !realtimeData) {
        return <div>No data...</div>
    }

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
                {/* <span className='text-base md:text-lg dark:text-white'>#{questionOrder + 1}</span> */}
                <CardTitle className='text-base md:text-lg dark:text-white'><QuestionCardTitle question={questionData} /></CardTitle>
                <RemoveQuestionFromRoundButton roundId={roundId} questionId={questionId} />
                {/* <UpdateCreatorButton roundId={roundId} questionId={questionId} /> */}
            </CardHeader>

            <CardContent className='flex flex-col justify-center items-center w-full'>
                <QuestionCardContent question={questionData} />
            </CardContent>

            <Divider className='my-2 bg-slate-600' />
            <CardFooter>
                <EditQuestionCardFooter realtimeData={realtimeData} />
            </CardFooter>

        </Card>
    );
}

function EditQuestionCardFooter({ realtimeData, lang = DEFAULT_LOCALE }) {
    const { id: gameId } = useParams()

    const organizerRef = doc(GAMES_COLLECTION_REF, gameId, 'organizers', realtimeData.managedBy)
    const [organizer, loading, error] = useDocumentDataOnce(organizerRef)
    if (error) {
        return <p>Error: {JSON.stringify(error)}</p>
    }
    if (loading) {
        return <p>Loading the creator...</p>
    }
    if (!organizer) {
        return <p>User not found</p>
    }

    return (
        <div className='flex flex-row w-full space-x-2 items-center'>
            <Avatar src={organizer.image} variant='rounded' sx={{ width: 30, height: 30 }} />
            <span>Manager: <strong>{organizer.name}</strong></span>
        </div>
    )
}

import PersonIcon from '@mui/icons-material/Person';

function UpdateCreatorButton({ roundId, questionId, lang = DEFAULT_LOCALE }) {
    const { id: gameId } = useParams()

    const [handleChange, isChanging] = useAsyncAction(async () => {
        await updateQuestionCreator(gameId, roundId, questionId, '')
    })

    return (
        <>
            <IconButton
                color='error'
                onClick={handleChange}
                disabled={isChanging}
            >
                <PersonIcon />
            </IconButton>
        </>
    )
}


function RemoveQuestionFromRoundButton({ roundId, questionId, lang = DEFAULT_LOCALE }) {
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
