import HomeIcon from '@mui/icons-material/Home';
import { Button } from '@mui/material';
import { useIntl } from 'react-intl';

import defineMessages from '@/frontend/i18n/defineMessages';

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
