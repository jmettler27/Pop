import { useUserContext } from '@/app/contexts'
import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import { Button, ButtonGroup, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Menu, MenuItem } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import VisibilityIcon from '@mui/icons-material/Visibility';

import EndQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/EndQuestionButton'
import ResetQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/ResetQuestionButton'
import ClearBuzzerButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/riddle/controller/ClearBuzzerButton'
import BuzzerHeadPlayer from '@/app/(game)/[id]/components/bottom-pane/question/question-active/riddle/controller/BuzzerHeadPlayer'

import { updatePlayerStatus } from '@/app/(game)/lib/players'
import { useAsyncAction } from '@/lib/utils/async'
import { useEffect, useState } from 'react'
import { cancelQuotePlayer, revealQuoteElement, validateAllQuoteElements } from '@/app/(game)/lib/question/quote'
import { isObjectEmpty } from '@/lib/utils'
import { atLeastOneElementRevealed, prependQuoteElementWithEmoji, quoteElementIsRevealed, quoteElementToTitle } from '@/lib/utils/question/quote'
import { getRandomElement, getRandomIndex, isEmpty } from '@/lib/utils/arrays'

export default function QuoteOrganizerController({ question, players }) {
    const game = useGameContext()

    /* Set the state 'focus' to the playerId which is the first element of the buzzed list */
    const buzzed = players.buzzed

    useEffect(() => {
        if (game.status === 'question_active' && buzzed.length > 0) {
            updatePlayerStatus(game.id, buzzed[0], 'focus')
        }
    }, [buzzed, game.status])

    return (
        <div className='flex flex-col h-full w-full items-center justify-around'>
            <BuzzerHeadPlayer buzzed={buzzed} />
            <QuoteOrganizerAnswerController buzzed={buzzed} question={question} />
            <QuoteOrganizerQuestionController />
        </div>
    )
}


function QuoteOrganizerAnswerController({ buzzed, question }) {
    const game = useGameContext()

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion)
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(realtimeDocRef)
    if (realtimeError) {
        return <p><strong>Error: {JSON.stringify(realtimeError)}</strong></p>
    }
    if (realtimeLoading) {
        return <CircularProgress />
    }
    if (!realtime) {
        return <></>
    }
    const { revealed } = realtime

    {/* Validate or invalidate the player's answer */ }
    return (
        <>
            <ButtonGroup
                disableElevation
                variant='contained'
                size='large'
                color='primary'
            // aria-label='outlined primary button group'
            >
                {/* Directly validate all the quote elements */}
                <ValidateAllQuoteElementsButton buzzed={buzzed} revealed={revealed} />

                <CancelQuoteElementButton buzzed={buzzed} />

                <RevealQuoteElementButton buzzed={buzzed} question={question} revealed={revealed} />

            </ButtonGroup>
        </>
    )
}

function ValidateAllQuoteElementsButton({ buzzed, revealed }) {
    const game = useGameContext()

    const atLeastOneRevealed = atLeastOneElementRevealed(revealed)
    const buzzedIsEmpty = isEmpty(buzzed)

    const [handleValidateAll, isValidating] = useAsyncAction(async () => {
        await validateAllQuoteElements(game.id, game.currentRound, game.currentQuestion, buzzed[0])
    })

    return (
        <Button
            color='success'
            startIcon={<CheckCircleIcon />}
            onClick={handleValidateAll}
            disabled={atLeastOneRevealed || buzzedIsEmpty || isValidating}
        >
            Validate all
        </Button>

    )
}


function CancelQuoteElementButton({ buzzed }) {
    const game = useGameContext()

    const buzzedIsEmpty = isEmpty(buzzed)

    const [handleCancelQuote, isCanceling] = useAsyncAction(async () => {
        await cancelQuotePlayer(game.id, game.currentRound, game.currentQuestion, buzzed[0])
    })

    return (
        <>
            <Button
                color='error'
                startIcon={<CancelIcon />}
                onClick={handleCancelQuote}
                disabled={buzzedIsEmpty || isCanceling}
            >
                Cancel
            </Button>
        </>

    )
}

function RevealQuoteElementButton({ buzzed, question, revealed }) {
    const buzzedIsEmpty = isEmpty(buzzed)

    const { toGuess, quoteParts } = question.details

    const [element, setElement] = useState(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const onDialogClose = () => {
        setDialogOpen(false)
        handleMenuClose()
        // Snackbar message 
    }

    const handleRevealButtonClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuItemClick = (quoteElem) => {
        setElement(quoteElem)
        setDialogOpen(true)
    };

    return (
        <>
            <Button
                color='info'
                startIcon={<VisibilityIcon />}
                onClick={handleRevealButtonClick}
                disabled={!buzzedIsEmpty}
            >
                Reveal
            </Button>

            <Menu
                id="reveal-quote-element-menu"
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                {toGuess.map((quoteElem, idx) => {
                    return (
                        <MenuItem key={idx}
                            onClick={() => handleMenuItemClick(quoteElem)}
                            disabled={quoteElementIsRevealed(revealed, quoteElem)}
                        >
                            {prependQuoteElementWithEmoji(quoteElem)}
                        </MenuItem>
                    )
                })}
            </Menu >

            <RevealQuoteElementDialog quoteElem={element} quoteParts={quoteParts} dialogOpen={dialogOpen} onDialogClose={onDialogClose} />
        </>
    )
}

function RevealQuoteElementDialog({ quoteElem, quoteParts, dialogOpen, onDialogClose }) {
    const game = useGameContext()

    const [handleRevealQuoteElement, isRevealing] = useAsyncAction(async () => {
        await revealQuoteElement(game.id, game.currentRound, game.currentQuestion, quoteElem, getRandomIndex(quoteParts))
        onDialogClose()
    })

    return (
        <Dialog
            disableEscapeKeyDown
            open={dialogOpen}
            onClose={onDialogClose}
        >
            <DialogTitle>Reveal an element of the quote: {quoteElementToTitle(quoteElem)}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to reveal the <strong>{quoteElementToTitle(quoteElem)}</strong>?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    variant='contained'
                    color='primary'
                    startIcon={<CheckCircleIcon />}
                    onClick={handleRevealQuoteElement}
                    disabled={isRevealing}
                >
                    Yes
                </Button>

                <Button
                    variant='outlined'
                    color='error'
                    startIcon={<CancelIcon />}
                    onClick={onDialogClose}
                    autoFocus
                >
                    No
                </Button>
            </DialogActions>
        </Dialog>
    )
}

function QuoteOrganizerQuestionController({ }) {
    return (
        <div className='flex flex-row w-full justify-end'>
            <ResetQuestionButton />
            <EndQuestionButton />
            <ClearBuzzerButton />
        </div>
    )
}
