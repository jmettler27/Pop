import { removeQuestionFromRound, updateQuestionCreator } from '@/backend/services/edit-game/edit-game'

import { useParams } from 'next/navigation'

import React, { useState, memo } from 'react'

import { CardTitle, CardHeader, CardContent, Card, CardFooter } from '@/frontend/components/card'
import { QuestionCardTitle, QuestionCardContent } from '@/frontend/components/questions/QuestionCard';

import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"

import { DIALOG_ACTION_CANCEL, DIALOG_WARNING } from '@/frontend/texts/dialogs'

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import { Avatar, Button, Divider } from '@mui/material';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material'

import DeleteIcon from '@mui/icons-material/Delete';


export const EditQuestionCard = memo(function EditQuestionCard({ roundId, questionId, questionOrder, status }) {
    const { id: gameId } = useParams()

    console.log("EditQuestionCard", gameId, roundId, questionId)

    const baseQuestionRepo = new BaseQuestionRepository()
    const { baseQuestion, loading: baseQuestionLoading, error: baseQuestionError } = baseQuestionRepo.useQuestionOnce(questionId)

    if (baseQuestionError) {
        return <p>Error: {JSON.stringify(baseQuestionError)}</p>
    }
    if (baseQuestionLoading) {
        return <p>Loading the question...</p>
    }
    if (!baseQuestion) {
        return <p>No data...</p>
    }

    console.log("baseQuestion.type", baseQuestion.type)


    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
                {/* <span className='text-base md:text-lg dark:text-white'>#{questionOrder + 1}</span> */}
                <CardTitle className='text-base md:text-lg dark:text-white'><QuestionCardTitle baseQuestion={baseQuestion} showType={true} /></CardTitle>
                {status === 'build' && <RemoveQuestionFromRoundButton roundId={roundId} questionId={questionId} />}
                {/* <UpdateCreatorButton roundId={roundId} questionId={questionId} /> */}
            </CardHeader>

            <CardContent className='flex flex-col justify-center items-center w-full'>
                <QuestionCardContent baseQuestion={baseQuestion} />
            </CardContent>

            <Divider className='my-2 bg-slate-600' />
            <CardFooter>
                {/* <EditQuestionCardFooter questionId={questionId} questionType={baseQuestion.type} roundId={roundId} /> */}
            </CardFooter>

        </Card>
    );
})

// function EditQuestionCardFooter({ questionId, questionType, roundId }) {
//     const { id: gameId } = useParams()

//     console.log("EditQuestionCardFooter", questionId, questionType, roundId)

//     const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(questionType, gameId, roundId)
//     const organizerRepo = new OrganizerRepository(gameId)

//     const { gameQuestion, loading: gameQuestionLoading, error: gameQuestionError } = gameQuestionRepo.useQuestionOnce(questionId)
//     const { organizer, loading: organizerLoading, error: organizerError } = organizerRepo.useOrganizerOnce(gameQuestion?.managedBy)
    
//     console.log("gameQuestion", gameQuestion)
//     console.log("organizer", organizer)

//     if (gameQuestionLoading || organizerLoading) {
//         return <p>Loading the question...</p>
//         }
//     if (gameQuestionError || organizerError) {
//         return <p>Error: {JSON.stringify(gameQuestionError || organizerError)}</p>
//     }
//     if (!gameQuestion || !organizer) {
//         return <p>No data...</p>
//     }

//     console.log("gameQuestion", gameQuestion)
//     console.log("organizer", organizer)

//     return (
//         <div className='flex flex-row w-full space-x-2 items-center'>
//             <Avatar src={organizer.image} variant='rounded' sx={{ width: 30, height: 30 }} />
//             <span>Manager: <strong>{organizer.name}</strong></span>
//         </div>
//     )
// }

import PersonIcon from '@mui/icons-material/Person';
import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';
import GameQuestionRepository from '@/backend/repositories/question/game/GameQuestionRepository';
import OrganizerRepository from '@/backend/repositories/user/OrganizerRepository';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/game/GameQuestionRepositoryFactory';

function UpdateCreatorButton({ roundId, questionId }) {
    const { id: gameId } = useParams()

    const [handleChange, isChanging] = useAsyncAction(async () => {
        // await updateQuestionCreator(gameId, roundId, questionId, '')
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
