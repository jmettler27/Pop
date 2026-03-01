import { useState } from 'react';

import { revealLabel } from '@/backend/services/question/labelling/actions';
import { isEmpty } from '@/backend/utils/arrays';
import { rankingToEmoji } from '@/backend/utils/emojis';

import { useGameContext } from '@/frontend/contexts';
import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Menu } from '@mui/material';
import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';

const messages = defineMessages('frontend.game.bottom.RevealLabelButton', {
  reveal: 'Reveal',
  revealListHeader: 'Reveal a label',
  areYouSureReveal: 'Are you sure you want to reveal',
  yes: 'Yes',
  no: 'No',
});

export default function RevealLabelButton({ buzzed, baseQuestion, gameQuestion }) {
  const intl = useIntl();
  const buzzedIsEmpty = isEmpty(buzzed);

  const labels = baseQuestion.labels;

  const [labelIdx, setLabelIdx] = useState(null);

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

  const handleRevealLabel = (idx) => {
    setLabelIdx(idx);
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
              {intl.formatMessage(messages.revealListHeader)}
            </ListSubheader>
          }
        >
          {labels.map((label, idx) => (
            <RevealLabelItemButton
              key={idx}
              gameQuestion={gameQuestion}
              label={label}
              labelIdx={idx}
              onClick={() => handleRevealLabel(idx)}
            />
          ))}
        </List>
      </Menu>

      <RevealLabelDialog
        baseQuestion={baseQuestion}
        labelIdx={labelIdx}
        dialogOpen={dialogOpen}
        onDialogClose={onDialogClose}
      />
    </>
  );
}

function RevealLabelItemButton({ gameQuestion, label, labelIdx, onClick }) {
  const itemText = `${rankingToEmoji(labelIdx)} ("${label}")`;

  return (
    <ListItemButton onClick={onClick} disabled={gameQuestion.labelIsRevealed(labelIdx)}>
      <ListItemText primary={itemText} />
    </ListItemButton>
  );
}

function RevealLabelDialog({ baseQuestion, labelIdx, dialogOpen, onDialogClose }) {
  const intl = useIntl();
  const game = useGameContext();

  const [handleRevealLabel, isRevealing] = useAsyncAction(async () => {
    await revealLabel(game.id, game.currentRound, game.currentQuestion, labelIdx);
    onDialogClose();
  });

  const labelToReveal = baseQuestion.labels[labelIdx];

  return (
    <Dialog disableEscapeKeyDown open={dialogOpen} onClose={onDialogClose}>
      <DialogTitle>{intl.formatMessage(messages.revealListHeader)}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {intl.formatMessage(messages.areYouSureReveal)} <strong>&quot;{labelToReveal}&quot;</strong>?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckCircleIcon />}
          onClick={handleRevealLabel}
          disabled={isRevealing}
        >
          {intl.formatMessage(messages.yes)}
        </Button>

        <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={onDialogClose} autoFocus>
          {intl.formatMessage(messages.no)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
