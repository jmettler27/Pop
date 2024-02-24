import { useEffect, useState } from 'react';
import { useUserContext } from '@/app/contexts'
import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { edgesToString } from '@/lib/utils/question/matching';
import { submitMatch } from '@/app/(game)/lib/question/matching';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { matchIsComplete } from '../gridUtils';
import { DIALOG_ACTION_CANCEL, DIALOG_ACTION_VALIDATE, DIALOG_TITLE } from '@/lib/utils/dialogs';

import { useAsyncAction } from '@/lib/utils/async';

export default function SubmitMatchDialog({ edges, setEdges, numCols, setNewEdgeSource, answer, lang = 'en' }) {
    const user = useUserContext()
    const game = useGameContext()

    const [dialogOpen, setDialogOpen] = useState(false)

    useEffect(() => {
        if (matchIsComplete(edges, numCols)) {
            setDialogOpen(true)
        }
    }, [edges])


    const handleMatchCancel = () => {
        setEdges([])
        setNewEdgeSource(null)
        setDialogOpen(false)
    }

    const [handleMatchValidate, isSubmitting] = useAsyncAction(async () => {
        await submitMatch(game.id, game.currentRound, game.currentQuestion, user.id, edges)
        setEdges([]) //
        setNewEdgeSource(null)
        setDialogOpen(false)
    })

    const onDialogClose = () => {
        setEdges([])
        setNewEdgeSource(null)
        setDialogOpen(false)
    }

    return (
        <Dialog disableEscapeKeyDown open={dialogOpen} onClose={onDialogClose}>
            <DialogTitle>{DIALOG_TITLE[lang]}</DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {edgesToString(edges, answer)}
                </DialogContentText>
            </DialogContent>

            <DialogActions>
                <Button
                    variant='contained'
                    color='primary'
                    onClick={handleMatchValidate}
                    disabled={isSubmitting}
                >
                    {DIALOG_ACTION_VALIDATE[lang]}
                </Button>

                <Button
                    variant='outlined'
                    color='error'
                    onClick={handleMatchCancel}
                >
                    {DIALOG_ACTION_CANCEL[lang]}
                </Button>
            </DialogActions>

        </Dialog>
    )
}