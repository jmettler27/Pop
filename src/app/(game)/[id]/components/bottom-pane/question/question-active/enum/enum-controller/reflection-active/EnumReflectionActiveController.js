
import { useState } from 'react'
import { useUserContext } from '@/app/contexts'
import { useGameContext, useRoleContext, useTeamContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import Timer from '@/app/(game)/[id]/components/Timer'
import EnumOrganizerTimerController from '@/app/(game)/[id]/components/bottom-pane/question/question-active/enum/enum-controller/EnumOrganizerTimerController'

import { Button, DialogContentText, InputLabel, MenuItem, FormControl, Select, Dialog, DialogActions, DialogContent, DialogTitle, OutlinedInput, CircularProgress } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

import { addPlayerBet, endEnumReflection } from '@/app/(game)/lib/question/enum'

import { range } from '@/lib/utils/arrays'
import { DIALOG_ACTION_CANCEL, DIALOG_ACTION_VALIDATE, DIALOG_TITLE, DIALOG_WARNING } from '@/lib/utils/dialogs'

import { useAsyncAction } from '@/lib/utils/async'

export default function EnumReflectionActiveController({ question, timer }) {
    const myRole = useRoleContext()

    switch (myRole) {
        case 'organizer':
            return <EnumOrganizerReflectionActive question={question} timer={timer} />
        case 'player':
            return <EnumPlayerReflectionActive question={question} timer={timer} />
        default:
            return <EnumViewerReflectionActive question={question} timer={timer} />
    }

}

/* ============================================================ Organizer ============================================================ */
function EnumOrganizerReflectionActive({ question, timer }) {
    const game = useGameContext()

    const handleReflectionEnd = async () => {
        await endEnumReflection(game.id, game.currentRound, game.currentQuestion)
    }

    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <EnumOrganizerTimerController
                question={question}
                timer={timer}
                onTimerEnd={handleReflectionEnd} />
        </div>
    )
}


/* ============================================================ Player ============================================================ */
function EnumPlayerReflectionActive({ question, timer }) {

    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <BetSelector question={question} status={timer.status} />
            <span className='text-4xl'><Timer
                forward={false}
                duration={question.details.thinkingTime}
                status={timer.status}
                onTimerEnd={() => { }} />
            </span>
        </div>
    )
}

function BetSelector({ question, status, lang = 'en' }) {
    const game = useGameContext()
    const user = useUserContext()
    const myTeam = useTeamContext()

    const [handleBetValidate, isSubmitting] = useAsyncAction(async () => {
        await addPlayerBet(game.id, game.currentRound, game.currentQuestion, user.id, myTeam, myBet)
        setHasValidated(true)
        setDialogOpen(false)
    })

    const [dialogOpen, setDialogOpen] = useState(false)
    const [myBet, setMyBet] = useState(0)
    const [hasValidated, setHasValidated] = useState(false)

    const playersDocRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion, 'realtime', 'players')
    const [players, playersLoading, playersError] = useDocumentDataOnce(playersDocRef)
    if (playersError) {
        return <p><strong>Error: </strong>{JSON.stringify(playersError)}</p>
    }
    if (playersLoading) {
        return <CircularProgress />
    }
    if (!players) {
        return <></>
    }

    const hasBet = players.bets.some(bet => bet.playerId == user.id)
    const selectorDisabled = ((status !== 'started') || hasValidated || hasBet);

    const handleSelectorChange = (event) => {
        setDialogOpen(true)
        setMyBet(event.target.value)
    }

    const handleBetCancel = () => {
        setMyBet(0)
        setDialogOpen(false)
    }


    const handleDialogClose = () => {
        setDialogOpen(false)
    }

    const choices = range(question.details.answer.length + 1)

    return (
        <div className='flex flex-row items-center justify-center'>

            {/* Selector of the bet */}
            <FormControl sx={{ m: 1, minWidth: 150 }}
                disabled={selectorDisabled}
            >
                <InputLabel
                    id='enum-bet-selector-input-label'
                    sx={{ color: 'inherit' }}
                >
                    {INPUT_LABEL[lang]}
                </InputLabel>

                <Select
                    id='enum-bet-selector-select'
                    labelId='enum-bet-selector-select-label'
                    value={myBet}
                    label={INPUT_LABEL[lang]}
                    onChange={handleSelectorChange}
                    autoWidth
                    sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'inherit',
                        },
                        // MuiInputBase-root-MuiOutlinedInput-root-MuiSelect-root.Mui-focused
                        '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'red',
                        },
                        '& .MuiSelect-icon': {
                            color: 'inherit'
                        },
                    }}
                >
                    {choices.map((choice, i) => <MenuItem key={i} value={choice}>{choice}</MenuItem>)}
                    {/* {!question.details.maxIsKnown && <MenuItem value={question.details.answer.length}>{`> ${question.details.answer.length}`}</MenuItem>} */}
                </Select>
            </FormControl>

            <Dialog disableEscapeKeyDown open={dialogOpen} onClose={handleDialogClose}>
                <DialogTitle>{DIALOG_TITLE[lang]} ({myBet})</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {DIALOG_WARNING[lang]}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant='contained'
                        color='primary'
                        // startIcon={<CheckCircleIcon />}
                        onClick={handleBetValidate}
                        disabled={isSubmitting}
                    >
                        {DIALOG_ACTION_VALIDATE[lang]}
                    </Button>

                    <Button
                        variant='outlined'
                        color='error'
                        // startIcon={<CancelIcon />}
                        sx={{ color: 'error' }}
                        onClick={handleBetCancel}
                        autoFocus
                    >
                        {DIALOG_ACTION_CANCEL[lang]}
                    </Button>

                </DialogActions>
            </Dialog>
        </div>
    )
}


const INPUT_LABEL = {
    'en': "My bet",
    'fr-FR': "Mon pari"
}

/* ============================================================ Viewer ============================================================ */
function EnumViewerReflectionActive({ question, timer }) {

    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <span className='text-6xl'>
                <Timer
                    forward={false}
                    duration={question.details.thinkingTime}
                    status={timer.status}
                    onTimerEnd={() => { }}
                />
            </span>
        </div>
    )

}