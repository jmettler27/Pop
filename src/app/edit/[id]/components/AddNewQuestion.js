import { useState } from 'react'

import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { questionTypeToTitle } from '@/lib/utils/question_types';
import { DIALOG_ACTION_CANCEL, DIALOG_ACTION_VALIDATE, DIALOG_TITLE } from '@/lib/utils/dialogs';
import { useAsyncAction } from '@/lib/utils/async';

import { QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { doc } from 'firebase/firestore';
import { useDocumentDataOnce } from 'react-firebase-hooks/firestore';


import LoadingScreen from '@/app/components/LoadingScreen';
// import { Button } from '@/components/ui/button'
import { CardTitle, CardHeader, CardContent, Card } from '@/app/components/card'
import { QuestionCard } from '@/app/components/questions/QuestionCard';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Menu, MenuItem } from '@mui/material'

import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game'

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

export function AddQuestionToRoundButton({ roundId, roundType, disabled }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const [dialog, setDialog] = useState(null)
    const onDialogClose = () => {
        setDialog(null)
        handleMenuClose()
        // Snackbar message 
    }

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    return (
        <>
            <Card variant='outlined' className='border-dashed border-2 border-red-700'>
                <CardContent className='flex flex-col h-full w-full items-center justify-center'>
                    <IconButton
                        id='add-new-question-button'
                        aria-controls={menuOpen ? 'basic-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={menuOpen ? 'true' : undefined}
                        color='primary'
                        onClick={handleClick}
                        disabled={disabled}
                        size='large'
                    >
                        <AddCircleOutlineIcon sx={{ fontSize: '35px' }} />
                    </IconButton>
                    <Menu
                        id="add-question-to-round-menu"
                        anchorEl={anchorEl}
                        open={menuOpen}
                        onClose={handleMenuClose}
                        MenuListProps={{
                            'aria-labelledby': 'basic-button',
                        }}
                    >
                        <MenuItem onClick={() => setDialog('new-question')}>🆕 Create a new question</MenuItem>
                        <MenuItem onClick={() => setDialog('existing-question')}>🔍 Search for an existing question</MenuItem>
                    </Menu>
                </CardContent>
            </Card>
            <AddQuestionToRoundDialog roundId={roundId} questionType={roundType} dialog={dialog} onDialogClose={onDialogClose} />
        </>
    )
}

function AddQuestionToRoundDialog({ roundId, questionType, dialog, onDialogClose }) {
    return (
        <Dialog open={dialog !== null} onClose={onDialogClose} maxWidth='xl'>
            <DialogTitle>
                {dialog === 'new-question' && `Submit a new question: ${questionTypeToTitle(questionType)}`}
                {dialog === 'existing-question' && `Search for a existing question: ${questionTypeToTitle(questionType)}`}
            </DialogTitle>
            <DialogContent>
                {dialog === 'new-question' && <SubmitQuestionDialog roundId={roundId} questionType={questionType} onDialogClose={onDialogClose} />}
                {dialog === 'existing-question' && <SearchQuestionDialog roundId={roundId} questionType={questionType} onDialogClose={onDialogClose} />}
            </DialogContent>
        </Dialog>
    )
}

import { SearchQuestionDataGrid } from '@/app/components/questions/QuestionDataGrid';
import CancelIcon from '@mui/icons-material/Cancel'

function SearchQuestionDialog({ roundId, questionType, onDialogClose }) {
    const [questionSelectionModel, setSelectedQuestionModel] = useState([]);
    const [validationDialogOpen, setValidationDialogOpen] = useState(false)

    // console.log("Question selection model", questionSelectionModel)

    const onNewQuestionSelectionModelChange = (newRowSelectionModel) => {
        setSelectedQuestionModel(newRowSelectionModel)
        if (newRowSelectionModel.length > 0) {
            setValidationDialogOpen(true)
        }
    }
    return (
        <>
            <SearchQuestionDataGrid questionType={questionType}
                questionSelectionModel={questionSelectionModel} onQuestionSelectionModelChange={onNewQuestionSelectionModelChange}
            />
            <Button
                variant='contained'
                color='error'
                startIcon={<CancelIcon />}
                onClick={onDialogClose}
            >
                Cancel
            </Button>
            <AddExistingQuestionToRoundDialog
                roundId={roundId}
                validationDialogOpen={validationDialogOpen} setValidationDialogOpen={setValidationDialogOpen}
                questionSelectionModel={questionSelectionModel} setSelectedQuestionModel={setSelectedQuestionModel}
                onDialogClose={onDialogClose} />
        </>
    )
}

function AddExistingQuestionToRoundDialog({ validationDialogOpen, setValidationDialogOpen, roundId, questionSelectionModel, setSelectedQuestionModel, onDialogClose, lang = 'fr-FR' }) {
    const { id: gameId } = useParams()
    const { data: session } = useSession()

    const selectedQuestionId = questionSelectionModel[0]


    const onValidationDialogClose = () => {
        setValidationDialogOpen(false)
        onDialogClose()
        setSelectedQuestionModel([])
    }

    const onValidationCancel = () => {
        setValidationDialogOpen(false)
        setSelectedQuestionModel([])
    }

    const [handleValidate, isValidating] = useAsyncAction(async () => {
        await addGameQuestion(gameId, roundId, selectedQuestionId, session.user.id)
        setValidationDialogOpen(false)
        onDialogClose()
        setSelectedQuestionModel([])
    })

    return (
        <Dialog open={validationDialogOpen} onClose={onValidationDialogClose} maxWidth='xl'>
            <DialogTitle>
                <DialogTitle>{ADD_EXISTING_QUESTION_TO_ROUND_DIALOG_TITLE[lang]}</DialogTitle>
            </DialogTitle>
            {selectedQuestionId && <AddExistingQuestionToRoundDialogContent selectedQuestionId={selectedQuestionId} />}
            <DialogActions>
                <Button
                    variant='contained'
                    color='primary'
                    onClick={handleValidate}
                    disabled={isValidating}
                >
                    {ADD_EXISTING_QUESTION_TO_ROUND_DIALOG_ACTION_VALIDATE[lang]}
                </Button>

                <Button
                    variant='outlined'
                    color='error'
                    onClick={onValidationCancel}
                >
                    {DIALOG_ACTION_CANCEL[lang]}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

function AddExistingQuestionToRoundDialogContent({ selectedQuestionId }) {
    const questionDocRef = doc(QUESTIONS_COLLECTION_REF, selectedQuestionId)
    const [question, questionLoading, questionError] = useDocumentDataOnce(questionDocRef)
    if (questionError) {
        return <p><strong>Error: {JSON.stringify(questionError)}</strong></p>
    }
    if (questionLoading) {
        return <span>Loading question...</span>
    }
    if (!question) {
        return <span>No question found</span>
    }

    return (
        <DialogContent>
            {selectedQuestionId && <QuestionCard question={question} />}
        </DialogContent>
    )
}

const ADD_EXISTING_QUESTION_TO_ROUND_DIALOG_TITLE = {
    'en': "Add this question to the round?",
    'fr-FR': "Ajouter cette question à la manche ?"
}

const ADD_EXISTING_QUESTION_TO_ROUND_DIALOG_ACTION_VALIDATE = {
    'en': "Add",
    'fr-FR': "Ajouter"
}


import { SubmitBlindtestQuestionForm } from '@/app/submit/blindtest/page'
import { SubmitEmojiQuestionForm } from '@/app/submit/emoji/page'
import { SubmitEnumQuestionForm } from '@/app/submit/enum/page'
import { SubmitImageQuestionForm } from '@/app/submit/image/page'
import { SubmitMatchingQuestionForm } from '@/app/submit/matching/page'
import { SubmitMCQForm } from '@/app/submit/mcq/page'
import { SubmitOOOQuestionForm } from '@/app/submit/odd_one_out/page'
import { SubmitProgressiveCluesQuestionForm } from '@/app/submit/progressive_clues/page'
import { SubmitQuoteQuestionForm } from '@/app/submit/quote/page'

function SubmitQuestionDialog({ roundId, questionType, onDialogClose }) {
    const { id: gameId } = useParams()
    const { data: session } = useSession()
    const userId = session.user.id

    switch (questionType) {
        case 'blindtest':
            return <SubmitBlindtestQuestionForm userId={userId} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'emoji':
            return <SubmitEmojiQuestionForm userId={userId} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'enum':
            return <SubmitEnumQuestionForm userId={userId} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'image':
            return <SubmitImageQuestionForm userId={userId} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'matching':
            return <SubmitMatchingQuestionForm userId={userId} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'mcq':
            return <SubmitMCQForm userId={userId} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'odd_one_out':
            return <SubmitOOOQuestionForm userId={userId} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'progressive_clues':
            return <SubmitProgressiveCluesQuestionForm userId={userId} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'quote':
            return <SubmitQuoteQuestionForm userId={userId} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
    }
}