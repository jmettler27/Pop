import { QuestionType, questionTypeToEmoji } from '@/backend/models/questions/QuestionType';

import { addQuestionToRound } from '@/backend/services/edit-game/actions';

import { useState, useCallback } from 'react';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

import globalMessages from '@/i18n/globalMessages';
import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.gameEditor.AddNewQuestion', {
  createNewQuestion: 'Create a new question',
  searchExisting: 'Search for an existing question',
  addToRoundDialogTitle: 'Add this question to the round?',
  addToRound: 'Add',
});
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { CardContent, Card } from '@/frontend/components/card';
import { QuestionCard } from '@/frontend/components/questions/QuestionCard';
import { SearchQuestionDataGrid } from '@/frontend/components/questions/QuestionDataGrid';

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

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';

const CREATE_NEW_QUESTION_EMOJI = '🆕';
const SEARCH_EXISTING_QUESTION_EMOJI = '🔍';

function prependCreateNewQuestionWithEmoji(label) {
  return `${CREATE_NEW_QUESTION_EMOJI} ${label}`;
}

function prependSearchExistingQuestionWithEmoji(label) {
  return `${SEARCH_EXISTING_QUESTION_EMOJI} ${label}`;
}

function AddQuestionToRoundDialog({ roundId, questionType, dialog, onDialogClose }) {
  const intl = useIntl();
  return (
    <Dialog open={dialog !== null} onClose={onDialogClose} maxWidth="xl">
      <DialogTitle>
        {dialog === 'new-question' &&
          `${intl.formatMessage(messages.createNewQuestion)} (${questionTypeToEmoji(questionType)})`}
        {dialog === 'existing-question' &&
          `${intl.formatMessage(messages.searchExisting)} (${questionTypeToEmoji(questionType)})`}
      </DialogTitle>
      <DialogContent>
        {dialog === 'new-question' && (
          <SubmitQuestionDialog roundId={roundId} questionType={questionType} onDialogClose={onDialogClose} />
        )}
        {dialog === 'existing-question' && (
          <SearchQuestionDialog roundId={roundId} questionType={questionType} onDialogClose={onDialogClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AddQuestionToRoundButton({ round, disabled }) {
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const [dialog, setDialog] = useState(null);
  const onDialogClose = () => {
    setDialog(null);
    handleMenuClose();
    // Snackbar message
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <Card variant="outlined" className="border-dashed border-2 border-red-700">
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
              {prependCreateNewQuestionWithEmoji(intl.formatMessage(messages.createNewQuestion))}
            </MenuItem>
            <MenuItem onClick={() => setDialog('existing-question')}>
              {prependSearchExistingQuestionWithEmoji(intl.formatMessage(messages.searchExisting))}
            </MenuItem>
          </Menu>
        </CardContent>
      </Card>
      <AddQuestionToRoundDialog
        roundId={round.id}
        questionType={round.type}
        dialog={dialog}
        onDialogClose={onDialogClose}
      />
    </>
  );
}

export function AddQuestionToMixedRoundButton({ roundId, disabled }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const [questionType, setQuestionType] = useState(null);

  const [dialog, setDialog] = useState(null);
  const onDialogClose = () => {
    setDialog(null);
    setQuestionType(null);
    handleMenuClose();
    // Snackbar message
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSelectNewQuestionType = (questionType) => {
    setQuestionType(questionType);
    setDialog('new-question');
  };

  const handleSelectExistingQuestionType = (questionType) => {
    setQuestionType(questionType);
    setDialog('existing-question');
  };

  console.log('Question type', questionType);
  console.log('Dialog', dialog);

  return (
    <>
      <Card variant="outlined" className="border-dashed border-2 border-red-700">
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

function SelectQuestionTypeButton({ type, handleListItemClick }) {
  const intl = useIntl();
  const [open, setOpen] = useState(true);

  const itemText = () => {
    switch (type) {
      case 'new-question':
        return prependCreateNewQuestionWithEmoji(intl.formatMessage(messages.createNewQuestion));
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
          {QuestionType.map((questionType, idx) => (
            <ListItemButton key={idx} sx={{ pl: 4 }} onClick={() => handleListItemClick(questionType)}>
              <ListItemText primary={prependQuestionTypeWithEmoji(questionType)} />
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </>
  );
}

// New question
import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';

import SubmitBasicQuestionForm from '@/frontend/components/forms/submit-question/SubmitBasicQuestionForm';
import SubmitBlindtestQuestionForm from '@/frontend/components/forms/submit-question/SubmitBlindtestQuestionForm';
import SubmitEmojiQuestionForm from '@/frontend/components/forms/submit-question/SubmitEmojiForm';
import SubmitEnumerationQuestionForm from '@/frontend/components/forms/submit-question/SubmitEnumerationForm';
import SubmitImageQuestionForm from '@/frontend/components/forms/submit-question/SubmitImageQuestionForm';
import SubmitLabellingQuestionForm from '@/frontend/components/forms/submit-question/SubmitLabellingQuestionForm';
import SubmitMatchingQuestionForm from '@/frontend/components/forms/submit-question/SubmitMatchingQuestionForm';
import SubmitMCQForm from '@/frontend/components/forms/submit-question/SubmitMCQQuestionForm';
import SubmitNaguiQuestionForm from '@/frontend/components/forms/submit-question/SubmitNaguiQuestionForm';
import SubmitOddOneOutQuestionForm from '@/frontend/components/forms/submit-question/SubmitOddOneOutQuestionForm';
import SubmitProgressiveCluesQuestionForm from '@/frontend/components/forms/submit-question/SubmitProgressiveCluesQuestionForm';
import SubmitQuoteQuestionForm from '@/frontend/components/forms/submit-question/SubmitQuoteQuestionForm';
import SubmitReorderingQuestionForm from '@/frontend/components/forms/submit-question/SubmitReorderingQuestionForm';

import { ExpandLess, ExpandMore } from '@mui/icons-material';

function SubmitQuestionDialog({ roundId, questionType, onDialogClose }) {
  const { id: gameId } = useParams();
  const { data: session } = useSession();
  const userId = session.user.id;

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
  }
}

// Existing question
function SearchQuestionDialog({ roundId, questionType, onDialogClose }) {
  const [questionSelectionModel, setSelectedQuestionModel] = useState([]);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);

  // console.log("Question selection model", questionSelectionModel)

  // Memoize callback to work with memoized SearchQuestionDataGrid
  // Prevents unnecessary re-fetching when dialog state changes
  const onNewQuestionSelectionModelChange = useCallback((newRowSelectionModel) => {
    setSelectedQuestionModel(newRowSelectionModel);
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

function AddExistingQuestionToRoundDialog({
  validationDialogOpen,
  setValidationDialogOpen,
  roundId,
  questionSelectionModel,
  setSelectedQuestionModel,
  onDialogClose,
}) {
  const intl = useIntl();
  const { id: gameId } = useParams();
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
    await addQuestionToRound(gameId, roundId, selectedQuestionId, session.user.id);
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

function AddExistingQuestionToRoundDialogContent({ selectedQuestionId }) {
  const questionRepo = new BaseQuestionRepository();
  const { baseQuestion, loading, error } = questionRepo.useQuestionOnce(selectedQuestionId);

  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <span>Loading question...</span>;
  }
  if (!baseQuestion) {
    return <span>No question found</span>;
  }

  return <DialogContent>{selectedQuestionId && <QuestionCard baseQuestion={baseQuestion} />}</DialogContent>;
}
