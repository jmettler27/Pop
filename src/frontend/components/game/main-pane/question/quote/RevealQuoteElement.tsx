import { useState } from 'react';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Menu } from '@mui/material';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import { useIntl } from 'react-intl';

import { revealQuoteElement } from '@/backend/services/question/quote/actions';
import { isEmpty } from '@/backend/utils/arrays';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import type { GameRounds } from '@/models/games/game';
import {
  GameQuoteQuestion,
  QuoteAuthorElement,
  QuotePart,
  QuotePartElement,
  QuoteQuestion,
  QuoteSourceElement,
} from '@/models/questions/quote';

const messages = defineMessages('frontend.game.bottom.RevealQuoteElement', {
  listHeader: 'Reveal an element of the quote',
});

interface RevealQuoteElementButtonProps {
  buzzed: string[];
  baseQuestion: QuoteQuestion;
  gameQuestion: GameQuoteQuestion;
}

export default function RevealQuoteElementButton({
  buzzed,
  baseQuestion,
  gameQuestion,
}: RevealQuoteElementButtonProps) {
  const intl = useIntl();
  const buzzedIsEmpty = isEmpty(buzzed);

  const author = baseQuestion.author;
  const source = baseQuestion.source;
  const quote = baseQuestion.quote ?? '';
  const toGuess = baseQuestion.toGuess ?? [];
  const quoteParts = baseQuestion.quoteParts ?? [];

  const [element, setElement] = useState<string | null>(null);
  const [quotePartIdx, setQuotePartIdx] = useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const onDialogClose = () => {
    setDialogOpen(false);
    handleMenuClose();
  };

  const handleRevealButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleRevealQuoteElement = (quoteElem: string) => {
    setElement(quoteElem);
    setDialogOpen(true);
  };

  return (
    <>
      <Button color="info" startIcon={<VisibilityIcon />} onClick={handleRevealButtonClick} disabled={!buzzedIsEmpty}>
        {intl.formatMessage(globalMessages.reveal)}
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
              default:
                return null;
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

interface RevealQuoteElementItemButtonProps {
  gameQuestion: GameQuoteQuestion;
  quoteElement: string | undefined;
  quoteElementStr: string;
  onClick: () => void;
}

function RevealQuoteElementItemButton({
  gameQuestion,
  quoteElement,
  quoteElementStr,
  onClick,
}: RevealQuoteElementItemButtonProps) {
  const intl = useIntl();
  const lang = intl.locale;
  const itemText = `${QuoteQuestion.prependElementWithEmoji(quoteElementStr, lang as 'en' | 'fr')} ("${quoteElement ?? ''}")`;

  return (
    <ListItemButton onClick={onClick} disabled={gameQuestion.quoteElementIsRevealed(quoteElementStr)}>
      <ListItemText primary={itemText} />
    </ListItemButton>
  );
}

interface RevealQuotePartItemButtonProps {
  gameQuestion: GameQuoteQuestion;
  quote: string;
  quoteParts: QuotePart[];
  setQuotePartIdx: (idx: number | null) => void;
  handleListItemClick: (quoteElem: string) => void;
}

function RevealQuotePartItemButton({
  gameQuestion,
  quote,
  quoteParts,
  setQuotePartIdx,
  handleListItemClick,
}: RevealQuotePartItemButtonProps) {
  const [open, setOpen] = useState(true);

  const intl = useIntl();
  const lang = intl.locale;
  const itemText = (quotePart: QuotePart) => {
    return `"${quote.substring(quotePart.startIdx, quotePart.endIdx + 1)}"`;
  };

  const handleSelectQuotePart = (idx: number) => {
    setQuotePartIdx(idx);
    handleListItemClick('quote');
  };

  return (
    <>
      <ListItemButton onClick={() => setOpen(!open)} disabled={gameQuestion.quoteElementIsRevealed('quote')}>
        <ListItemText primary={QuoteQuestion.prependElementWithEmoji('quote', lang as 'en' | 'fr')} />
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

interface RevealQuoteElementDialogProps {
  baseQuestion: QuoteQuestion;
  quoteElem: string | null;
  quoteParts: QuotePart[];
  quotePartIdx: number | null;
  dialogOpen: boolean;
  onDialogClose: () => void;
}

function RevealQuoteElementDialog({
  baseQuestion,
  quoteElem,
  quoteParts,
  quotePartIdx,
  dialogOpen,
  onDialogClose,
}: RevealQuoteElementDialogProps) {
  const intl = useIntl();
  const game = useGame();

  const [handleRevealQuoteElement, isRevealing] = useAsyncAction(async () => {
    if (!game || !quoteElem) return;
    await revealQuoteElement(
      game.id as string,
      game.currentRound as string,
      game.currentQuestion as string,
      quoteElem,
      quotePartIdx
    );
    onDialogClose();
  });

  const details = baseQuestion.toObject().details as Record<string, unknown>;
  const elementToReveal = quoteElem ? ((details[quoteElem] as string | undefined) ?? '') : '';
  const elementToRevealText = () => {
    if (quoteElem === 'quote' && quotePartIdx !== null && !isEmpty(quoteParts)) {
      const quotePart = quoteParts[quotePartIdx];
      if (quotePart) {
        return elementToReveal.substring(quotePart.startIdx, quotePart.endIdx + 1);
      }
    }
    return elementToReveal;
  };

  return (
    <Dialog disableEscapeKeyDown open={dialogOpen} onClose={onDialogClose}>
      <DialogTitle>
        {intl.formatMessage(messages.listHeader)}: {quoteElem ? QuoteQuestion.elementToTitle(quoteElem) : ''}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {intl.formatMessage(globalMessages.areYouSureReveal)} <strong>&quot;{elementToRevealText()}&quot;</strong>?
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
          {intl.formatMessage(globalMessages.yes)}
        </Button>

        <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={onDialogClose} autoFocus>
          {intl.formatMessage(globalMessages.no)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
