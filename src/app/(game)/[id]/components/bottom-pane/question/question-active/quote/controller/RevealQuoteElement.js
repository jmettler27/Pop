import { useGameContext } from '@/app/(game)/contexts'


import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Menu } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import VisibilityIcon from '@mui/icons-material/Visibility';

import { useAsyncAction } from '@/lib/utils/async'
import { useState } from 'react'
import { revealQuoteElement } from '@/app/(game)/lib/question/quote'
import { prependQuoteElementWithEmoji, quoteElementIsRevealed, quoteElementToTitle, quotePartIsRevealed } from '@/lib/utils/question/quote'
import { isEmpty } from '@/lib/utils/arrays'

import * as React from 'react';
import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { DEFAULT_LOCALE } from '@/lib/utils/locales';

export default function RevealQuoteElementButton({ buzzed, question, revealed, lang = DEFAULT_LOCALE }) {
    const buzzedIsEmpty = isEmpty(buzzed)

    const { toGuess, quoteParts } = question.details

    const [element, setElement] = useState(null)
    const [quotePartIdx, setQuotePartIdx] = useState(null)

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

    const handleListItemClick = (quoteElem) => {
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
                    {toGuess.map((quoteElem, idx) => {
                        switch (quoteElem) {
                            case 'author':
                                return <AuthorListItemButton key={idx}
                                    revealed={revealed}
                                    author={question.details.author}
                                    onClick={() => handleListItemClick('author')}
                                />
                            case 'source':
                                return <SourceListItemButton key={idx}
                                    revealed={revealed}
                                    source={question.details.source}
                                    onClick={() => handleListItemClick('source')}
                                />
                            case 'quote':
                                return <QuoteListItemButton key={idx}
                                    revealed={revealed}
                                    quote={question.details.quote}
                                    quoteParts={quoteParts}
                                    setQuotePartIdx={setQuotePartIdx}
                                    handleListItemClick={handleListItemClick}
                                />
                        }
                    })}
                </List>
            </Menu >

            <RevealQuoteElementDialog question={question} quoteElem={element} quoteParts={quoteParts} quotePartIdx={quotePartIdx} dialogOpen={dialogOpen} onDialogClose={onDialogClose} />
        </>
    )
}

const REVEAL_BUTTON_LABEL = {
    'en': 'Reveal',
    'fr-FR': 'Révéler'
}

const REVEAL_LIST_HEADER = {
    'en': 'Reveal an element of the quote',
    'fr-FR': 'Révéler un élément de la réplique'
}


function AuthorListItemButton({ revealed, author, onClick }) {

    const itemText = `${prependQuoteElementWithEmoji('author')} ("${author}")`

    return (
        <ListItemButton
            onClick={onClick}
            disabled={quoteElementIsRevealed(revealed, 'author')}
        >
            <ListItemText primary={itemText} />
        </ListItemButton>
    )
}

function SourceListItemButton({ revealed, source, onClick }) {

    const itemText = `${prependQuoteElementWithEmoji('source')} ("${source}")`

    return (
        <ListItemButton
            onClick={onClick}
            disabled={quoteElementIsRevealed(revealed, 'source')}
        >
            <ListItemText primary={itemText} />
        </ListItemButton>
    )
}


function QuoteListItemButton({ revealed, quote, quoteParts, setQuotePartIdx, handleListItemClick }) {
    const [open, setOpen] = useState(true);

    const itemText = (quotePart) => {
        return `"${quote.substring(quotePart.startIdx, quotePart.endIdx + 1)}"`
    }

    const handleQuotePartClick = (idx) => {
        setQuotePartIdx(idx)
        handleListItemClick('quote')
    }

    return (
        <>
            <ListItemButton
                onClick={() => setOpen(!open)}
                disabled={quoteElementIsRevealed(revealed, 'quote')}
            >
                <ListItemText primary={prependQuoteElementWithEmoji('quote')} />
                {open ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {quoteParts.map((part, idx) => {
                        return (
                            <ListItemButton key={idx} sx={{ pl: 4 }}
                                onClick={() => handleQuotePartClick(idx)}
                                disabled={quotePartIsRevealed(revealed, idx)}
                            >
                                <ListItemText primary={itemText(part)} />
                            </ListItemButton>
                        )

                    })}
                </List>
            </Collapse>
        </>
    )
}

function RevealQuoteElementDialog({ question, quoteElem, quoteParts, quotePartIdx, dialogOpen, onDialogClose, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const [handleRevealQuoteElement, isRevealing] = useAsyncAction(async () => {
        await revealQuoteElement(game.id, game.currentRound, game.currentQuestion, quoteElem, quotePartIdx)
        onDialogClose()
    })

    const elementToReveal = question.details[quoteElem]
    const elementToRevealText = () => {
        if (quoteElem === 'quote' && quotePartIdx !== null && !isEmpty(quoteParts)) {
            const quotePart = quoteParts[quotePartIdx]
            return elementToReveal.substring(quotePart.startIdx, quotePart.endIdx + 1)
        }
        return elementToReveal
    }

    return (
        <Dialog
            disableEscapeKeyDown
            open={dialogOpen}
            onClose={onDialogClose}
        >
            <DialogTitle>{REVEAL_LIST_HEADER[lang]}: {quoteElementToTitle(quoteElem)}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {REVEAL_QUOTE_ELEMENT_DIALOG_CONTENT_TEXT[lang]} <strong>&quot;{elementToRevealText()}&quot;</strong>?
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

const REVEAL_QUOTE_ELEMENT_DIALOG_CONTENT_TEXT = {
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