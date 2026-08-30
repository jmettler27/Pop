import { useCallback, useState } from 'react';

import { CirclePlus, XCircle } from 'lucide-react';
import { useIntl } from 'react-intl';

import { addRoundQuestion } from '@/api';
import { QuestionCard } from '@/components/common/QuestionCard';
import { QuestionSearchTable } from '@/components/common/QuestionSearchTable';
import SubmitBasicQuestionForm from '@/components/question-forms/SubmitBasicQuestionForm';
import SubmitBlindtestQuestionForm from '@/components/question-forms/SubmitBlindtestQuestionForm';
import SubmitEmojiQuestionForm from '@/components/question-forms/SubmitEmojiQuestionForm';
import SubmitEnumerationQuestionForm from '@/components/question-forms/SubmitEnumerationQuestionForm';
import SubmitEstimationQuestionForm from '@/components/question-forms/SubmitEstimationQuestionForm';
import SubmitImageQuestionForm from '@/components/question-forms/SubmitImageQuestionForm';
import SubmitLabellingQuestionForm from '@/components/question-forms/SubmitLabellingQuestionForm';
import SubmitMatchingQuestionForm from '@/components/question-forms/SubmitMatchingQuestionForm';
import SubmitMCQForm from '@/components/question-forms/SubmitMCQQuestionForm';
import SubmitNaguiQuestionForm from '@/components/question-forms/SubmitNaguiQuestionForm';
import SubmitOddOneOutQuestionForm from '@/components/question-forms/SubmitOddOneOutQuestionForm';
import SubmitProgressiveCluesQuestionForm from '@/components/question-forms/SubmitProgressiveCluesQuestionForm';
import SubmitQuoteQuestionForm from '@/components/question-forms/SubmitQuoteQuestionForm';
import SubmitReorderingQuestionForm from '@/components/question-forms/SubmitReorderingQuestionForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useEditableQuestion } from '@/hooks/editableQuestion';
import useAsyncAction from '@/hooks/useAsyncAction';
import useGameId from '@/hooks/useGameId';
import defineMessages from '@/i18n/defineMessages';
import globalMessages from '@/i18n/globalMessages';
import { QuestionType, questionTypeToEmoji } from '@/models/questions/question-type';
import { AnyRound } from '@/models/rounds/RoundFactory';

const messages = defineMessages('frontend.gameEditor.AddQuestionToRound', {
  searchExisting: 'Search for an existing question',
  addToRoundDialogTitle: 'Add this question to the round?',
  addToRound: 'Add',
});

const CREATE_NEW_QUESTION_EMOJI = '🆕';
const SEARCH_EXISTING_QUESTION_EMOJI = '🔍';

const DIALOG_MODES = {
  createQuestion: 'create-question',
  searchQuestion: 'search-question',
} as const;

function prependCreateNewQuestionWithEmoji(label: string) {
  return `${CREATE_NEW_QUESTION_EMOJI} ${label}`;
}

function prependSearchExistingQuestionWithEmoji(label: string) {
  return `${SEARCH_EXISTING_QUESTION_EMOJI} ${label}`;
}

type DialogMode = (typeof DIALOG_MODES)[keyof typeof DIALOG_MODES] | null;

interface AddQuestionToRoundDialogProps {
  roundId: string;
  questionType: QuestionType | null;
  dialog: DialogMode;
  onDialogClose: () => void;
}

function AddQuestionToRoundDialog({ roundId, questionType, dialog, onDialogClose }: AddQuestionToRoundDialogProps) {
  const intl = useIntl();
  return (
    <Dialog open={dialog !== null} onOpenChange={(open) => !open && onDialogClose()}>
      <DialogContent showCloseButton={false} className="w-fit sm:max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dialog === DIALOG_MODES.createQuestion &&
              `${intl.formatMessage(globalMessages.createNewQuestion)} (${questionType ? questionTypeToEmoji(questionType) : ''})`}
            {dialog === DIALOG_MODES.searchQuestion &&
              `${intl.formatMessage(messages.searchExisting)} (${questionType ? questionTypeToEmoji(questionType) : ''})`}
          </DialogTitle>
        </DialogHeader>
        {dialog === DIALOG_MODES.createQuestion && questionType && (
          <CreateQuestionDialog roundId={roundId} questionType={questionType} onDialogClose={onDialogClose} />
        )}
        {dialog === DIALOG_MODES.searchQuestion && questionType && (
          <SearchQuestionDialog roundId={roundId} questionType={questionType} onDialogClose={onDialogClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AddQuestionToRoundButtonProps {
  round: AnyRound;
  disabled: boolean;
}

export function AddQuestionToRoundButton({ round, disabled }: AddQuestionToRoundButtonProps) {
  const intl = useIntl();
  const [menuOpen, setMenuOpen] = useState(false);
  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  const [dialog, setDialog] = useState<DialogMode>(null);
  const onDialogClose = () => {
    setDialog(null);
    handleMenuClose();
    // Snackbar message
  };

  return (
    <>
      <Card className="border-dashed border-2 border-red-700">
        <CardContent className="flex flex-col h-full w-full items-center justify-center">
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger
              render={<Button id="add-new-question-button" variant="ghost" size="icon-lg" disabled={disabled} />}
            >
              <CirclePlus className="size-9" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setDialog(DIALOG_MODES.createQuestion)}
                  className="w-full text-left px-4 py-2 hover:bg-muted"
                >
                  {prependCreateNewQuestionWithEmoji(intl.formatMessage(globalMessages.createNewQuestion))}
                </button>
                <button
                  type="button"
                  onClick={() => setDialog(DIALOG_MODES.searchQuestion)}
                  className="w-full text-left px-4 py-2 hover:bg-muted"
                >
                  {prependSearchExistingQuestionWithEmoji(intl.formatMessage(messages.searchExisting))}
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>
      <AddQuestionToRoundDialog
        roundId={round.id ?? ''}
        questionType={round.type as QuestionType}
        dialog={dialog}
        onDialogClose={onDialogClose}
      />
    </>
  );
}

interface CreateQuestionDialogProps {
  roundId: string;
  questionType: QuestionType;
  onDialogClose: () => void;
}

function CreateQuestionDialog({ roundId, questionType, onDialogClose }: CreateQuestionDialogProps) {
  const gameId = useGameId();

  switch (questionType) {
    case QuestionType.BASIC:
      return (
        <SubmitBasicQuestionForm inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
      );
    case QuestionType.BLINDTEST:
      return (
        <SubmitBlindtestQuestionForm
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.EMOJI:
      return (
        <SubmitEmojiQuestionForm inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
      );
    case QuestionType.ENUMERATION:
      return (
        <SubmitEnumerationQuestionForm
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.ESTIMATION:
      return (
        <SubmitEstimationQuestionForm
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.IMAGE:
      return (
        <SubmitImageQuestionForm inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
      );
    case QuestionType.LABELLING:
      return (
        <SubmitLabellingQuestionForm
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.MATCHING:
      return (
        <SubmitMatchingQuestionForm
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.MCQ:
      return <SubmitMCQForm inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />;
    case QuestionType.NAGUI:
      return (
        <SubmitNaguiQuestionForm inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
      );
    case QuestionType.ODD_ONE_OUT:
      return (
        <SubmitOddOneOutQuestionForm
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.PROGRESSIVE_CLUES:
      return (
        <SubmitProgressiveCluesQuestionForm
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.QUOTE:
      return (
        <SubmitQuoteQuestionForm inGameEditor={true} gameId={gameId} roundId={roundId} onDialogClose={onDialogClose} />
      );
    case QuestionType.REORDERING:
      return (
        <SubmitReorderingQuestionForm
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    default:
      return null;
  }
}

interface SearchQuestionDialogProps {
  roundId: string;
  questionType: QuestionType;
  onDialogClose: () => void;
}

// Existing question
function SearchQuestionDialog({ roundId, questionType, onDialogClose }: SearchQuestionDialogProps) {
  const intl = useIntl();
  const [questionSelectionModel, setSelectedQuestionModel] = useState<string[]>([]);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);

  // QuestionSearchTable owns its row-selection state internally; bumping this key remounts it
  // with a fresh (empty) selection whenever the validation dialog is cancelled/closed.
  const [gridResetKey, setGridResetKey] = useState(0);

  const onNewQuestionSelectionModelChange = useCallback((newRowSelectionModel: string[]) => {
    setSelectedQuestionModel(newRowSelectionModel);
    if (newRowSelectionModel.length > 0) {
      setValidationDialogOpen(true);
    }
  }, []);

  const resetSelectedQuestionModel = useCallback((model: string[]) => {
    setSelectedQuestionModel(model);
    if (model.length === 0) {
      setGridResetKey((key) => key + 1);
    }
  }, []);

  return (
    <>
      <QuestionSearchTable
        key={gridResetKey}
        questionType={questionType}
        onQuestionSelectionModelChange={onNewQuestionSelectionModelChange}
      />
      <Button variant="destructive" onClick={onDialogClose}>
        <XCircle className="mr-2 size-4" />
        {intl.formatMessage(globalMessages.cancel)}
      </Button>
      <AddExistingQuestionToRoundDialog
        roundId={roundId}
        validationDialogOpen={validationDialogOpen}
        setValidationDialogOpen={setValidationDialogOpen}
        questionSelectionModel={questionSelectionModel}
        setSelectedQuestionModel={resetSelectedQuestionModel}
        onDialogClose={onDialogClose}
      />
    </>
  );
}

interface AddExistingQuestionToRoundDialogProps {
  validationDialogOpen: boolean;
  setValidationDialogOpen: (open: boolean) => void;
  roundId: string;
  questionSelectionModel: string[];
  setSelectedQuestionModel: (model: string[]) => void;
  onDialogClose: () => void;
}

function AddExistingQuestionToRoundDialog({
  validationDialogOpen,
  setValidationDialogOpen,
  roundId,
  questionSelectionModel,
  setSelectedQuestionModel,
  onDialogClose,
}: AddExistingQuestionToRoundDialogProps) {
  const intl = useIntl();
  const gameId = useGameId();

  const selectedQuestionId = questionSelectionModel[0];

  const onValidationDialogClose = () => {
    setValidationDialogOpen(false);
    onDialogClose();
    setSelectedQuestionModel([]);
  };

  const onValidationCancel = () => {
    setValidationDialogOpen(false);
    setSelectedQuestionModel([]);
  };

  const [handleValidate, isValidating] = useAsyncAction(async () => {
    await addRoundQuestion(gameId, roundId, { questionId: selectedQuestionId });
    setValidationDialogOpen(false);
    onDialogClose();
    setSelectedQuestionModel([]);
  });

  return (
    <Dialog
      open={validationDialogOpen}
      onOpenChange={(open, eventDetails) => {
        if (eventDetails.reason === 'escape-key') return;
        if (!open) onValidationDialogClose();
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{intl.formatMessage(messages.addToRoundDialogTitle)}</DialogTitle>
        </DialogHeader>
        {selectedQuestionId && <AddExistingQuestionToRoundDialogContent selectedQuestionId={selectedQuestionId} />}
        <DialogFooter>
          <Button onClick={handleValidate} disabled={isValidating}>
            {intl.formatMessage(messages.addToRound)}
          </Button>

          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={onValidationCancel}
          >
            {intl.formatMessage(globalMessages.cancel)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddExistingQuestionToRoundDialogContentProps {
  selectedQuestionId: string;
}

function AddExistingQuestionToRoundDialogContent({ selectedQuestionId }: AddExistingQuestionToRoundDialogContentProps) {
  const gameId = useGameId();
  const { baseQuestion, baseQuestionLoading, baseQuestionError } = useEditableQuestion(
    gameId as string,
    selectedQuestionId
  );

  if (baseQuestionError || baseQuestionLoading || !baseQuestion) {
    return <></>;
  }

  return selectedQuestionId ? <QuestionCard baseQuestion={baseQuestion} /> : null;
}
