import { useParams } from 'next/navigation'

import React from 'react';
import { useState } from 'react'

import { Button } from '@mui/material';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete';

import { CardTitle, CardHeader, CardContent, Card } from '@/app/components/card'

import { questionTypeToEmoji, typeSchema } from '@/lib/utils/question_types'
import { GAME_ROUND_MAX_NUM_QUESTIONS } from '@/lib/utils/round'
import { useAsyncAction } from '@/lib/utils/async'
import { DIALOG_ACTION_CANCEL, DIALOG_WARNING } from '@/lib/utils/dialogs'

import { removeRoundFromGame } from '@/app/edit/[id]/lib/edit-game'

import { AddQuestionToRoundButton } from '@/app/edit/[id]/components/AddNewQuestion'
import { EditQuestionCard } from '@/app/edit/[id]/components/EditQuestionInRound';

export function EditGameRoundCard({ roundId, round }) {
    // <div className='border-dashed border-4 p-2 w-[30%] h-full overflow-auto'>

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2 space-y-0'>
                <CardTitle className='text-lg font-medium'>{questionTypeToEmoji(round.type)} <i>{round.title}</i></CardTitle>
                <RemoveRoundFromGameButton roundId={roundId} />
            </CardHeader>
            <CardContent>
                <div className='grid gap-4 md:grid-cols-4'>
                    <EditGameRoundQuestionCards round={round} />
                    <AddQuestionToRoundButton
                        roundId={roundId}
                        roundType={round.type}
                        disabled={round.questions.length >= GAME_ROUND_MAX_NUM_QUESTIONS}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

function RemoveRoundFromGameButton({ roundId, lang = 'en' }) {
    const { id: gameId } = useParams()

    const [dialogOpen, setDialogOpen] = useState(false)

    const [handleRemoveRound, isRemoving] = useAsyncAction(async () => {
        await removeRoundFromGame(gameId, roundId)
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
                <DialogTitle>{REMOVE_ROUND_FROM_GAME_DIALOG_TITLE[lang]}</DialogTitle>

                <DialogContent>
                    <DialogContentText>
                        {DIALOG_WARNING[lang]}
                    </DialogContentText>
                </DialogContent>

                <DialogActions>
                    <Button
                        variant='contained'
                        color='primary'
                        onClick={handleRemoveRound}
                        disabled={isRemoving}
                    >
                        {REMOVE_ROUND_FROM_GAME_DIALOG_ACTION_VALIDATE[lang]}
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

const REMOVE_ROUND_FROM_GAME_DIALOG_TITLE = {
    'en': "Are you sure you want to remove this round?",
    'fr-FR': "T'es sûr de vouloir supprimer cette round ?"
}

const REMOVE_ROUND_FROM_GAME_DIALOG_ACTION_VALIDATE = {
    'en': "Yes",
    'fr-FR': "Oui"
}

function EditGameRoundQuestionCards({ round }) {
    return round.questions.map((questionId, idx) => (
        <EditQuestionCard key={questionId}
            roundId={round.id}
            questionId={questionId}
            questionOrder={idx}
        />
    ))
}