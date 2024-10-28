import { useState } from 'react'

import { useGameContext } from '@/app/(game)/contexts'

import { DEFAULT_LOCALE } from '@/lib/utils/locales';
import { useAsyncAction } from '@/lib/utils/async'
import { isEmpty } from '@/lib/utils/arrays'
import { labelIsRevealed } from '@/lib/utils/question/label';
import { rankingToEmoji } from '@/lib/utils/emojis';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Menu } from '@mui/material'
import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import VisibilityIcon from '@mui/icons-material/Visibility';

import { revealLabel } from '@/app/(game)/lib/question/label';


export default function RevealLabelButton({ buzzed, question, revealed, lang = DEFAULT_LOCALE }) {
    const buzzedIsEmpty = isEmpty(buzzed)

    const { labels } = question.details

    const [labelIdx, setLabelIdx] = useState(null)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const onDialogClose = () => {
        setDialogOpen(false)
        handleMenuClose()
    }

    const handleRevealButtonClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleRevealLabel = (idx) => {
        setLabelIdx(idx)
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
                {REVEAL_BUTTON_LABEL[lang]}
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
                <List
                    sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}
                    component="nav"
                    aria-labelledby="nested-list-subheader"
                    subheader={
                        <ListSubheader component="div" id="nested-list-subheader">
                            {REVEAL_LIST_HEADER[lang]}
                        </ListSubheader>
                    }
                >
                    {labels.map((label, idx) => <RevealLabelItemButton key={idx}
                        revealed={revealed}
                        label={label}
                        labelIdx={idx}
                        onClick={() => handleRevealLabel(idx)}
                    />
                    )}
                </List>
            </Menu >

            <RevealLabelDialog question={question} labelIdx={labelIdx} dialogOpen={dialogOpen} onDialogClose={onDialogClose} />
        </>
    )
}

const REVEAL_BUTTON_LABEL = {
    'en': 'Reveal',
    'fr-FR': 'Révéler'
}

const REVEAL_LIST_HEADER = {
    'en': 'Reveal an label',
    'fr-FR': 'Révéler une étiquette'
}


function RevealLabelItemButton({ revealed, label, labelIdx, onClick }) {
    const itemText = `${rankingToEmoji(labelIdx)} ("${label}")`

    return (
        <ListItemButton
            onClick={onClick}
            disabled={labelIsRevealed(revealed, labelIdx)}
        >
            <ListItemText primary={itemText} />
        </ListItemButton>
    )
}

function RevealLabelDialog({ question, labelIdx, dialogOpen, onDialogClose, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const [handleRevealLabel, isRevealing] = useAsyncAction(async () => {
        await revealLabel(game.id, game.currentRound, game.currentQuestion, labelIdx)
        onDialogClose()
    })

    const labelToReveal = question.details.labels[labelIdx]

    return (
        <Dialog
            disableEscapeKeyDown
            open={dialogOpen}
            onClose={onDialogClose}
        >
            <DialogTitle>{REVEAL_LIST_HEADER[lang]}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {REVEAL_LABEL_DIALOG_CONTENT_TEXT[lang]} <strong>&quot;{labelToReveal}&quot;</strong>?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    variant='contained'
                    color='primary'
                    startIcon={<CheckCircleIcon />}
                    onClick={handleRevealLabel}
                    disabled={isRevealing}
                >
                    {DIALOG_YES_BUTTON_LABEL[lang]}
                </Button>

                <Button
                    variant='outlined'
                    color='error'
                    startIcon={<CancelIcon />}
                    onClick={onDialogClose}
                    autoFocus
                >
                    {DIALOG_NO_BUTTON_LABEL[lang]}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

const REVEAL_LABEL_DIALOG_CONTENT_TEXT = {
    'en': "Are you sure you want to reveal",
    'fr-FR': "Es-tu sûr de vouloir révéler"
}

const DIALOG_YES_BUTTON_LABEL = {
    'en': 'Yes',
    'fr-FR': 'Oui'
}

const DIALOG_NO_BUTTON_LABEL = {
    'en': 'No',
    'fr-FR': 'Non'
}