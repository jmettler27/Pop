import { useState } from 'react';

import { CheckCircle2, Eye, XCircle } from 'lucide-react';
import { useIntl } from 'react-intl';

import { questionAction } from '@/frontend/api';
import { Button } from '@/frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/frontend/components/ui/popover';
import { rankingToEmoji } from '@/frontend/helpers/emojis';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameLabellingQuestion, LabellingQuestion } from '@/models/questions/labelling';
import { isEmpty } from '@/utils/arrays';

const messages = defineMessages('frontend.game.bottom.RevealLabelButton', {
  revealListHeader: 'Reveal a label',
});

interface RevealLabelButtonProps {
  buzzed: string[];
  baseQuestion: LabellingQuestion;
  gameQuestion: GameLabellingQuestion;
}

export default function RevealLabelButton({ buzzed, baseQuestion, gameQuestion }: RevealLabelButtonProps) {
  const intl = useIntl();
  const buzzedIsEmpty = isEmpty(buzzed);

  const labels = baseQuestion.labels;

  const [labelIdx, setLabelIdx] = useState<number | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  const onDialogClose = () => {
    setDialogOpen(false);
    handleMenuClose();
  };

  const handleRevealLabel = (idx: number) => {
    setLabelIdx(idx);
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
              {intl.formatMessage(messages.revealListHeader)}
            </li>
            {(labels ?? []).map((label, idx) => (
              <RevealLabelItemButton
                key={idx}
                gameQuestion={gameQuestion}
                label={label}
                labelIdx={idx}
                onClick={() => handleRevealLabel(idx)}
              />
            ))}
          </ul>
        </PopoverContent>
      </Popover>

      <RevealLabelDialog
        baseQuestion={baseQuestion}
        labelIdx={labelIdx}
        dialogOpen={dialogOpen}
        onDialogClose={onDialogClose}
      />
    </>
  );
}

interface RevealLabelItemButtonProps {
  gameQuestion: GameLabellingQuestion;
  label: string;
  labelIdx: number;
  onClick: () => void;
}

function RevealLabelItemButton({ gameQuestion, label, labelIdx, onClick }: RevealLabelItemButtonProps) {
  const itemText = `${rankingToEmoji(labelIdx)} ("${label}")`;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={gameQuestion.labelIsRevealed(labelIdx)}
        className="w-full text-left px-4 py-2 hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
      >
        {itemText}
      </button>
    </li>
  );
}

interface RevealLabelDialogProps {
  baseQuestion: LabellingQuestion;
  labelIdx: number | null;
  dialogOpen: boolean;
  onDialogClose: () => void;
}

function RevealLabelDialog({ baseQuestion, labelIdx, dialogOpen, onDialogClose }: RevealLabelDialogProps) {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const [handleRevealLabel, isRevealing] = useAsyncAction(async () => {
    if (labelIdx === null) return;
    await questionAction(gameId, roundId, questionId, { action: 'reveal_label', labelIdx });
    onDialogClose();
  });

  if (labelIdx === null) return null;

  const labelToReveal = baseQuestion.labels?.[labelIdx];

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
          <DialogTitle>{intl.formatMessage(messages.revealListHeader)}</DialogTitle>
          <DialogDescription>
            {intl.formatMessage(globalMessages.areYouSureReveal)} <strong>&quot;{labelToReveal}&quot;</strong>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleRevealLabel} disabled={isRevealing}>
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
