import { useState } from 'react'

import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { prependQuestionTypeWithEmoji, questionTypeToTitle } from '@/lib/utils/question_types';
import { DIALOG_ACTION_CANCEL, DIALOG_ACTION_VALIDATE, DIALOG_TITLE } from '@/lib/utils/dialogs';
import { useAsyncAction } from '@/lib/utils/async';
import { DEFAULT_LOCALE } from '@/lib/utils/locales';

import { QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { doc } from 'firebase/firestore';
import { useDocumentDataOnce } from 'react-firebase-hooks/firestore';


import { CardContent, Card } from '@/app/components/card'
import { QuestionCard } from '@/app/components/questions/QuestionCard';
import { SearchQuestionDataGrid } from '@/app/components/questions/QuestionDataGrid';
import { addGameQuestion } from '@/app/edit/[id]/lib/edit-game'

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Menu, MenuItem } from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel'


const CREATE_NEW_QUESTION = {
    'en': "Create a new question",
    'fr-FR': "Créer une nouvelle question"
}

const SEARCH_EXISTING_QUESTION = {
    'en': "Search for an existing question",
    'fr-FR': "Rechercher une question existante"
}

export function AddQuestionToRoundButton({ roundId, roundType, disabled, lang = DEFAULT_LOCALE }) {
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
                        <MenuItem onClick={() => setDialog('new-question')}>🆕 {CREATE_NEW_QUESTION[lang]}</MenuItem>
                        <MenuItem onClick={() => setDialog('existing-question')}>🔍 {SEARCH_EXISTING_QUESTION[lang]}</MenuItem>
                    </Menu>
                </CardContent>
            </Card>
            <AddQuestionToRoundDialog roundId={roundId} questionType={roundType} dialog={dialog} onDialogClose={onDialogClose} />
        </>
    )
}




function AddQuestionToRoundDialog({ roundId, questionType, dialog, onDialogClose, lang = DEFAULT_LOCALE }) {
    return (
        <Dialog open={dialog !== null} onClose={onDialogClose} maxWidth='xl'>
            <DialogTitle>
                {dialog === 'new-question' && `${CREATE_NEW_QUESTION[lang]} (${prependQuestionTypeWithEmoji(questionType)})`}
                {dialog === 'existing-question' && `${SEARCH_EXISTING_QUESTION[lang]} (${prependQuestionTypeWithEmoji(questionType)})`}
            </DialogTitle>
            <DialogContent>
                {dialog === 'new-question' && <SubmitQuestionDialog roundId={roundId} questionType={questionType} onDialogClose={onDialogClose} />}
                {dialog === 'existing-question' && <SearchQuestionDialog roundId={roundId} questionType={questionType} onDialogClose={onDialogClose} />}
            </DialogContent>
        </Dialog>
    )
}

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

function AddExistingQuestionToRoundDialog({ validationDialogOpen, setValidationDialogOpen, roundId, questionSelectionModel, setSelectedQuestionModel, onDialogClose, lang = DEFAULT_LOCALE }) {
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
import { SubmitBasicQuestionForm } from '@/app/submit/basic/page';

function SubmitQuestionDialog({ roundId, questionType, onDialogClose }) {
    const { id: gameId } = useParams()
    const { data: session } = useSession()
    const userId = session.user.id

    switch (questionType) {
        case 'blindtest':
            return <SubmitBlindtestQuestionForm userId={userId} lang={DEFAULT_LOCALE} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'emoji':
            return <SubmitEmojiQuestionForm userId={userId} lang={DEFAULT_LOCALE} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'enum':
            return <SubmitEnumQuestionForm userId={userId} lang={DEFAULT_LOCALE} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'image':
            return <SubmitImageQuestionForm userId={userId} lang={DEFAULT_LOCALE} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'matching':
            return <SubmitMatchingQuestionForm userId={userId} lang={DEFAULT_LOCALE} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'mcq':
            return <SubmitMCQForm userId={userId} lang={DEFAULT_LOCALE} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'basic':
            return <SubmitBasicQuestionForm userId={userId} lang={DEFAULT_LOCALE} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'odd_one_out':
            return <SubmitOOOQuestionForm userId={userId} lang={DEFAULT_LOCALE} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'progressive_clues':
            return <SubmitProgressiveCluesQuestionForm userId={userId} lang={DEFAULT_LOCALE} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
        case 'quote':
            return <SubmitQuoteQuestionForm userId={userId} lang={DEFAULT_LOCALE} inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
    }
}