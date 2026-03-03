import { Button } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.bottom.GoGameHomeButton', {
  goHome: 'Go to Home',
});

export default function GoGameHomeButton({ onClick, disabled }) {
  const intl = useIntl();
  return (
    <Button size="large" startIcon={<HomeIcon />} variant="contained" onClick={onClick} disabled={disabled}>
      {intl.formatMessage(messages.goHome)}
    </Button>
  );
}
