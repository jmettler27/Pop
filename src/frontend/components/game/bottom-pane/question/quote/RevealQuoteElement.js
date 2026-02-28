import {
  QuoteQuestion,
  QuoteAuthorElement,
  QuoteSourceElement,
  QuotePartElement,
} from '@/backend/models/questions/Quote';

import { revealQuoteElement } from '@/backend/services/question/quote/actions';

import { isEmpty } from '@/backend/utils/arrays';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useGameContext } from '@/frontend/contexts';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.bottom.RevealQuoteElement', {
  reveal: 'Reveal',
  listHeader: 'Reveal an element of the quote',
  dialogContentText: 'Are you sure you want to reveal',
  dialogYes: 'Yes',
  dialogNo: 'No',
});

import { useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Menu } from '@mui/material';
import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function RevealQuoteElementButton({ buzzed, baseQuestion, gameQuestion }) {
  const intl = useIntl();
  const buzzedIsEmpty = isEmpty(buzzed);

  const author = baseQuestion.author;
  const source = baseQuestion.source;
  const quote = baseQuestion.quote;
  const toGuess = baseQuestion.toGuess;
  const quoteParts = baseQuestion.quoteParts;

  const [element, setElement] = useState(null);
  const [quotePartIdx, setQuotePartIdx] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const onDialogClose = () => {
    setDialogOpen(false);
    handleMenuClose();
  };

  const handleRevealButtonClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleRevealQuoteElement = (quoteElem) => {
    setElement(quoteElem);
    setDialogOpen(true);
  };

  return (
    <>
      <Button color="info" startIcon={<VisibilityIcon />} onClick={handleRevealButtonClick} disabled={!buzzedIsEmpty}>
        {intl.formatMessage(messages.reveal)}
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
              {intl.formatMessage(messages.listHeader)}
            </ListSubheader>
          }
        >
          {toGuess.map((quoteElem, idx) => {
            switch (quoteElem) {
              case QuoteAuthorElement.TYPE:
                return (
                  <RevealQuoteElementItemButton
                    key={idx}
                    gameQuestion={gameQuestion}
                    quoteElement={author}
                    quoteElementStr={QuoteAuthorElement.TYPE}
                    onClick={() => handleRevealQuoteElement(QuoteAuthorElement.TYPE)}
                  />
                );
              case QuoteSourceElement.TYPE:
                return (
                  <RevealQuoteElementItemButton
                    key={idx}
                    gameQuestion={gameQuestion}
                    quoteElement={source}
                    quoteElementStr={QuoteSourceElement.TYPE}
                    onClick={() => handleRevealQuoteElement(QuoteSourceElement.TYPE)}
                  />
                );
              case QuotePartElement.TYPE:
                return (
                  <RevealQuotePartItemButton
                    key={idx}
                    gameQuestion={gameQuestion}
                    quote={quote}
                    quoteParts={quoteParts}
                    setQuotePartIdx={setQuotePartIdx}
                    handleListItemClick={handleRevealQuoteElement}
                  />
                );
            }
          })}
        </List>
      </Menu>

      <RevealQuoteElementDialog
        baseQuestion={baseQuestion}
        quoteElem={element}
        quoteParts={quoteParts}
        quotePartIdx={quotePartIdx}
        dialogOpen={dialogOpen}
        onDialogClose={onDialogClose}
      />
    </>
  );
}

function RevealQuoteElementItemButton({ gameQuestion, quoteElement, quoteElementStr, onClick }) {
  const itemText = `${QuoteQuestion.elementToEmoji(quoteElementStr)} ("${quoteElement}")`;

  return (
    <ListItemButton onClick={onClick} disabled={gameQuestion.quoteElementIsRevealed(quoteElementStr)}>
      <ListItemText primary={itemText} />
    </ListItemButton>
  );
}

function RevealQuotePartItemButton({ gameQuestion, quote, quoteParts, setQuotePartIdx, handleListItemClick }) {
  const [open, setOpen] = useState(true);

  const itemText = (quotePart) => {
    return `"${quote.substring(quotePart.startIdx, quotePart.endIdx + 1)}"`;
  };

  const handleSelectQuotePart = (idx) => {
    setQuotePartIdx(idx);
    handleListItemClick('quote');
  };

  return (
    <>
      <ListItemButton onClick={() => setOpen(!open)} disabled={gameQuestion.quoteElementIsRevealed('quote')}>
        <ListItemText primary={QuoteQuestion.prependElementWithEmoji('quote')} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {quoteParts.map((part, idx) => (
            <ListItemButton
              key={idx}
              sx={{ pl: 4 }}
              onClick={() => handleSelectQuotePart(idx)}
              disabled={gameQuestion.quotePartIsRevealed(idx)}
            >
              <ListItemText primary={itemText(part)} />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </>
  );
}

function RevealQuoteElementDialog({ baseQuestion, quoteElem, quoteParts, quotePartIdx, dialogOpen, onDialogClose }) {
  const intl = useIntl();
  const game = useGameContext();

  const [handleRevealQuoteElement, isRevealing] = useAsyncAction(async () => {
    await revealQuoteElement(game.id, game.currentRound, game.currentQuestion, quoteElem, quotePartIdx);
    onDialogClose();
  });

  const elementToReveal = baseQuestion.toObject().details[quoteElem];
  const elementToRevealText = () => {
    if (quoteElem === 'quote' && quotePartIdx !== null && !isEmpty(quoteParts)) {
      const quotePart = quoteParts[quotePartIdx];
      return elementToReveal.substring(quotePart.startIdx, quotePart.endIdx + 1);
    }
    return elementToReveal;
  };

  return (
    <Dialog disableEscapeKeyDown open={dialogOpen} onClose={onDialogClose}>
      <DialogTitle>
        {intl.formatMessage(messages.listHeader)}: {QuoteQuestion.elementToTitle(quoteElem)}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {intl.formatMessage(messages.dialogContentText)} <strong>&quot;{elementToRevealText()}&quot;</strong>?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckCircleIcon />}
          onClick={handleRevealQuoteElement}
          disabled={isRevealing}
        >
          {intl.formatMessage(messages.dialogYes)}
        </Button>

        <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={onDialogClose} autoFocus>
          {intl.formatMessage(messages.dialogNo)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
