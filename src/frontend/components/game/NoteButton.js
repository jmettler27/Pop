import * as React from 'react';
import WarningIcon from '@mui/icons-material/Warning';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

export default function NoteButton({ note }) {
  return (
    <Tooltip title={note}>
      <IconButton>
        <WarningIcon color="success" />
      </IconButton>
    </Tooltip>
  );
}
