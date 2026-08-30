import { useState } from 'react';

import { CheckCircle2, ChevronDown, ChevronUp, Eye, XCircle } from 'lucide-react';
import { useIntl } from 'react-intl';

import { questionAction, type QuestionActionRequest } from '@/api';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { isEmpty } from '@/helpers/arrays';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useAsyncAction from '@/hooks/useAsyncAction';
import defineMessages from '@/i18n/defineMessages';
import globalMessages from '@/i18n/globalMessages';
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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  const onDialogClose = () => {
    setDialogOpen(false);
    handleMenuClose();
  };

  const handleRevealQuoteElement = (quoteElem: string) => {
    setElement(quoteElem);
    setDialogOpen(true);
  };

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger
          render={<Button className="bg-blue-500 text-white hover:bg-blue-500/80" disabled={!buzzedIsEmpty} />}
        >
          <Eye className="mr-2 size-4" />
          {intl.formatMessage(globalMessages.reveal)}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <ul className="w-full max-w-[360px] bg-background" aria-labelledby="nested-list-subheader">
            <li id="nested-list-subheader" className="px-4 py-2 text-sm font-medium text-muted-foreground">
              {intl.formatMessage(messages.listHeader)}
            </li>
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
          </ul>
        </PopoverContent>
      </Popover>

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
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={gameQuestion.quoteElementIsRevealed(quoteElementStr)}
        className="w-full text-left px-4 py-2 hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
      >
        {itemText}
      </button>
    </li>
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
    <li>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          render={
            <button
              type="button"
              disabled={gameQuestion.quoteElementIsRevealed('quote')}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            />
          }
        >
          {QuoteQuestion.prependElementWithEmoji('quote', lang as 'en' | 'fr')}
          {open ? <ChevronUp /> : <ChevronDown />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul>
            {quoteParts.map((part: QuotePart, idx: number) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => handleSelectQuotePart(idx)}
                  disabled={gameQuestion.quotePartIsRevealed(idx)}
                  className="w-full text-left pl-8 pr-4 py-2 hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                >
                  {itemText(part)}
                </button>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
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
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const [handleRevealQuoteElement, isRevealing] = useAsyncAction(async () => {
    if (!quoteElem) return;
    await questionAction(gameId, roundId, questionId, {
      action: 'reveal_quote_element',
      quoteElem: quoteElem as QuestionActionRequest['quoteElem'],
      quotePartIdx: quotePartIdx ?? undefined,
    });
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
    <Dialog
      open={dialogOpen}
      onOpenChange={(open, eventDetails) => {
        if (eventDetails.reason === 'escape-key') return;
        if (!open) onDialogClose();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            {intl.formatMessage(messages.listHeader)}: {quoteElem ? QuoteQuestion.elementToTitle(quoteElem) : ''}
          </DialogTitle>
          <DialogDescription>
            {intl.formatMessage(globalMessages.areYouSureReveal)} <strong>&quot;{elementToRevealText()}&quot;</strong>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleRevealQuoteElement} disabled={isRevealing}>
            <CheckCircle2 className="mr-2 size-4" />
            {intl.formatMessage(globalMessages.yes)}
          </Button>

          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={onDialogClose}
            autoFocus
          >
            <XCircle className="mr-2 size-4" />
            {intl.formatMessage(globalMessages.no)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
