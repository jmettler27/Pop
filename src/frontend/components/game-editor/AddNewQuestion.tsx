import { useCallback, useState } from 'react';
import { useParams } from 'next/navigation';

import { ExpandLess, ExpandMore } from '@mui/icons-material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import {
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
} from '@mui/material';
import type { GridRowSelectionModel } from '@mui/x-data-grid';
import { useSession } from 'next-auth/react';
import { useIntl } from 'react-intl';

// New question
import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import { addQuestionToRound } from '@/backend/services/edit-game/actions';
import { Card, CardContent } from '@/frontend/components/card';
import { QuestionCard } from '@/frontend/components/common/QuestionCard';
import { SearchQuestionDataGrid } from '@/frontend/components/common/QuestionDataGrid';
import SubmitBasicQuestionForm from '@/frontend/components/question-forms/SubmitBasicQuestionForm';
import SubmitBlindtestQuestionForm from '@/frontend/components/question-forms/SubmitBlindtestQuestionForm';
import SubmitEmojiQuestionForm from '@/frontend/components/question-forms/SubmitEmojiQuestionForm';
import SubmitEnumerationQuestionForm from '@/frontend/components/question-forms/SubmitEnumerationQuestionForm';
import SubmitEstimationQuestionForm from '@/frontend/components/question-forms/SubmitEstimationQuestionForm';
import SubmitImageQuestionForm from '@/frontend/components/question-forms/SubmitImageQuestionForm';
import SubmitLabellingQuestionForm from '@/frontend/components/question-forms/SubmitLabellingQuestionForm';
import SubmitMatchingQuestionForm from '@/frontend/components/question-forms/SubmitMatchingQuestionForm';
import SubmitMCQForm from '@/frontend/components/question-forms/SubmitMCQQuestionForm';
import SubmitNaguiQuestionForm from '@/frontend/components/question-forms/SubmitNaguiQuestionForm';
import SubmitOddOneOutQuestionForm from '@/frontend/components/question-forms/SubmitOddOneOutQuestionForm';
import SubmitProgressiveCluesQuestionForm from '@/frontend/components/question-forms/SubmitProgressiveCluesQuestionForm';
import SubmitQuoteQuestionForm from '@/frontend/components/question-forms/SubmitQuoteQuestionForm';
import SubmitReorderingQuestionForm from '@/frontend/components/question-forms/SubmitReorderingQuestionForm';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { prependQuestionTypeWithEmoji, QuestionType, questionTypeToEmoji } from '@/models/questions/question-type';
import { AnyRound } from '@/models/rounds/RoundFactory';

const messages = defineMessages('frontend.gameEditor.AddNewQuestion', {
  searchExisting: 'Search for an existing question',
  addToRoundDialogTitle: 'Add this question to the round?',
  addToRound: 'Add',
});

const CREATE_NEW_QUESTION_EMOJI = '🆕';
const SEARCH_EXISTING_QUESTION_EMOJI = '🔍';

function prependCreateNewQuestionWithEmoji(label: string) {
  return `${CREATE_NEW_QUESTION_EMOJI} ${label}`;
}

function prependSearchExistingQuestionWithEmoji(label: string) {
  return `${SEARCH_EXISTING_QUESTION_EMOJI} ${label}`;
}

type DialogMode = 'new-question' | 'existing-question' | null;

interface AddQuestionToRoundDialogProps {
  roundId: string;
  questionType: QuestionType | null;
  dialog: DialogMode;
  onDialogClose: () => void;
}

function AddQuestionToRoundDialog({ roundId, questionType, dialog, onDialogClose }: AddQuestionToRoundDialogProps) {
  const intl = useIntl();
  return (
    <Dialog open={dialog !== null} onClose={onDialogClose} maxWidth="xl">
      <DialogTitle>
        {dialog === 'new-question' &&
          `${intl.formatMessage(globalMessages.createNewQuestion)} (${questionType ? questionTypeToEmoji(questionType) : ''})`}
        {dialog === 'existing-question' &&
          `${intl.formatMessage(messages.searchExisting)} (${questionType ? questionTypeToEmoji(questionType) : ''})`}
      </DialogTitle>
      <DialogContent>
        {dialog === 'new-question' && questionType && (
          <SubmitQuestionDialog roundId={roundId} questionType={questionType} onDialogClose={onDialogClose} />
        )}
        {dialog === 'existing-question' && questionType && (
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
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorEl);
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const [dialog, setDialog] = useState<DialogMode>(null);
  const onDialogClose = () => {
    setDialog(null);
    handleMenuClose();
    // Snackbar message
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <Card className="border-dashed border-2 border-red-700">
        <CardContent className="flex flex-col h-full w-full items-center justify-center">
          <IconButton
            id="add-new-question-button"
            aria-controls={menuOpen ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? 'true' : undefined}
            color="primary"
            onClick={handleClick}
            disabled={disabled}
            size="large"
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
            <MenuItem onClick={() => setDialog('new-question')}>
              {prependCreateNewQuestionWithEmoji(intl.formatMessage(globalMessages.createNewQuestion))}
            </MenuItem>
            <MenuItem onClick={() => setDialog('existing-question')}>
              {prependSearchExistingQuestionWithEmoji(intl.formatMessage(messages.searchExisting))}
            </MenuItem>
          </Menu>
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

interface AddQuestionToMixedRoundButtonProps {
  roundId: string;
  disabled: boolean;
}

export function AddQuestionToMixedRoundButton({ roundId, disabled }: AddQuestionToMixedRoundButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorEl);
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const [questionType, setQuestionType] = useState<QuestionType | null>(null);

  const [dialog, setDialog] = useState<DialogMode>(null);
  const onDialogClose = () => {
    setDialog(null);
    setQuestionType(null);
    handleMenuClose();
    // Snackbar message
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSelectNewQuestionType = (qt: QuestionType) => {
    setQuestionType(qt);
    setDialog('new-question');
  };

  const handleSelectExistingQuestionType = (qt: QuestionType) => {
    setQuestionType(qt);
    setDialog('existing-question');
  };

  console.log('Question type', questionType);
  console.log('Dialog', dialog);

  return (
    <>
      <Card className="border-dashed border-2 border-red-700">
        <CardContent className="flex flex-col h-full w-full items-center justify-center">
          <IconButton
            id="mixed-round-add-new-question-button"
            aria-controls={menuOpen ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? 'true' : undefined}
            color="primary"
            onClick={handleClick}
            disabled={disabled}
            size="large"
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
            <List
              sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}
              component="nav"
              aria-labelledby="nested-list-subheader"
              subheader={
                <ListSubheader component="div" id="nested-list-subheader">
                  {/* {REVEAL_LIST_HEADER[lang]} */}
                </ListSubheader>
              }
            >
              <SelectQuestionTypeButton key={0} type="new-question" handleListItemClick={handleSelectNewQuestionType} />
              <SelectQuestionTypeButton
                key={1}
                type="existing-question"
                handleListItemClick={handleSelectExistingQuestionType}
              />
            </List>
          </Menu>
        </CardContent>
      </Card>
      <AddQuestionToRoundDialog
        roundId={roundId}
        questionType={questionType}
        dialog={dialog}
        onDialogClose={onDialogClose}
      />
    </>
  );
}

interface SelectQuestionTypeButtonProps {
  type: 'new-question' | 'existing-question';
  handleListItemClick: (questionType: QuestionType) => void;
}

function SelectQuestionTypeButton({ type, handleListItemClick }: SelectQuestionTypeButtonProps) {
  const intl = useIntl();
  const [open, setOpen] = useState(true);

  const itemText = () => {
    switch (type) {
      case 'new-question':
        return prependCreateNewQuestionWithEmoji(intl.formatMessage(globalMessages.createNewQuestion));
      case 'existing-question':
        return prependSearchExistingQuestionWithEmoji(intl.formatMessage(messages.searchExisting));
    }
  };

  return (
    <>
      <ListItemButton onClick={() => setOpen(!open)}>
        <ListItemText primary={itemText()} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {Object.values(QuestionType).map((questionType, idx) => (
            <ListItemButton key={idx} sx={{ pl: 4 }} onClick={() => handleListItemClick(questionType)}>
              <ListItemText primary={prependQuestionTypeWithEmoji(questionType)} />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </>
  );
}

interface SubmitQuestionDialogProps {
  roundId: string;
  questionType: QuestionType;
  onDialogClose: () => void;
}

function SubmitQuestionDialog({ roundId, questionType, onDialogClose }: SubmitQuestionDialogProps) {
  const { id } = useParams();
  const gameId = id as string;
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';

  switch (questionType) {
    case QuestionType.BASIC:
      return (
        <SubmitBasicQuestionForm
          userId={userId}
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.BLINDTEST:
      return (
        <SubmitBlindtestQuestionForm
          userId={userId}
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.EMOJI:
      return (
        <SubmitEmojiQuestionForm
          userId={userId}
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.ENUMERATION:
      return (
        <SubmitEnumerationQuestionForm
          userId={userId}
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.ESTIMATION:
      return (
        <SubmitEstimationQuestionForm
          userId={userId}
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.IMAGE:
      return (
        <SubmitImageQuestionForm
          userId={userId}
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.LABELLING:
      return (
        <SubmitLabellingQuestionForm
          userId={userId}
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.MATCHING:
      return (
        <SubmitMatchingQuestionForm
          userId={userId}
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.MCQ:
      return (
        <SubmitMCQForm
          userId={userId}
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.NAGUI:
      return (
        <SubmitNaguiQuestionForm
          userId={userId}
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.ODD_ONE_OUT:
      return (
        <SubmitOddOneOutQuestionForm
          userId={userId}
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.PROGRESSIVE_CLUES:
      return (
        <SubmitProgressiveCluesQuestionForm
          userId={userId}
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.QUOTE:
      return (
        <SubmitQuoteQuestionForm
          userId={userId}
          inGameEditor={true}
          gameId={gameId}
          roundId={roundId}
          onDialogClose={onDialogClose}
        />
      );
    case QuestionType.REORDERING:
      return (
        <SubmitReorderingQuestionForm
          userId={userId}
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
  const [questionSelectionModel, setSelectedQuestionModel] = useState<string[]>([]);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);

  // Memoize callback to work with memoized SearchQuestionDataGrid
  // Prevents unnecessary re-fetching when dialog state changes
  const onNewQuestionSelectionModelChange = useCallback((newRowSelectionModel: GridRowSelectionModel) => {
    setSelectedQuestionModel(newRowSelectionModel as string[]);
    if (newRowSelectionModel.length > 0) {
      setValidationDialogOpen(true);
    }
  }, []);
  return (
    <>
      <SearchQuestionDataGrid
        questionType={questionType}
        questionSelectionModel={questionSelectionModel}
        onQuestionSelectionModelChange={onNewQuestionSelectionModelChange}
      />
      <Button variant="contained" color="error" startIcon={<CancelIcon />} onClick={onDialogClose}>
        Cancel
      </Button>
      <AddExistingQuestionToRoundDialog
        roundId={roundId}
        validationDialogOpen={validationDialogOpen}
        setValidationDialogOpen={setValidationDialogOpen}
        questionSelectionModel={questionSelectionModel}
        setSelectedQuestionModel={setSelectedQuestionModel}
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
  const { id } = useParams();
  const gameId = id as string;
  const { data: session } = useSession();

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
    await addQuestionToRound(gameId, roundId, selectedQuestionId, session?.user?.id ?? '');
    setValidationDialogOpen(false);
    onDialogClose();
    setSelectedQuestionModel([]);
  });

  return (
    <Dialog open={validationDialogOpen} onClose={onValidationDialogClose} maxWidth="xl">
      <DialogTitle>{intl.formatMessage(messages.addToRoundDialogTitle)}</DialogTitle>
      {selectedQuestionId && <AddExistingQuestionToRoundDialogContent selectedQuestionId={selectedQuestionId} />}
      <DialogActions>
        <Button variant="contained" color="primary" onClick={handleValidate} disabled={isValidating}>
          {intl.formatMessage(messages.addToRound)}
        </Button>

        <Button variant="outlined" color="error" onClick={onValidationCancel}>
          {intl.formatMessage(globalMessages.cancel)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface AddExistingQuestionToRoundDialogContentProps {
  selectedQuestionId: string;
}

function AddExistingQuestionToRoundDialogContent({ selectedQuestionId }: AddExistingQuestionToRoundDialogContentProps) {
  const questionRepo = new BaseQuestionRepository(QuestionType.BASIC);
  const { baseQuestion, baseQuestionLoading, baseQuestionError } = questionRepo.useQuestionOnce(selectedQuestionId);

  if (baseQuestionError || baseQuestionLoading || !baseQuestion) {
    return <></>;
  }

  return <DialogContent>{selectedQuestionId && <QuestionCard baseQuestion={baseQuestion} />}</DialogContent>;
}
